import { Inject, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { Tag } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { max, min } from 'date-fns';
import { UpdateTagDto } from './dto/update-tag.dto';
import { findAllTags } from './queries/findAllTags';
import { findOneTag } from './queries/findOneTag';
import { findOverlappingTags } from './queries/findOverlappingTags';
import { createTag } from './queries/createTag';
import { updateTag } from './queries/updateTag';
import { updateTagTime } from './queries/updateTagTime';
import { deleteTag } from './queries/deleteTag';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class TagsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTag: Record<string, any>): Tag {
    return unflatten(rawTag);
  }

  async findAll(startedAt: string, endedAt: string): Promise<Tag[]> {
    try {
      const rawTags = findAllTags(this.databaseService.getDb(), {
        startedAt,
        endedAt,
      });

      return rawTags.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all tags from the database', err, {
        startedAt,
        endedAt,
      });
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Tag> {
    try {
      const rawTag = findOneTag(this.databaseService.getDb(), { id });

      return this.adapt(rawTag);
    } catch (err) {
      const error = new CustomError('Failed to fetch one tag from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();

      // Normalise start/end order
      let effectiveStart = min([new Date(createTagDto.startedAt), new Date(createTagDto.endedAt)]);
      let effectiveEnd = max([new Date(createTagDto.startedAt), new Date(createTagDto.endedAt)]);

      // ── Pass 1: iteratively merge same-tagName overlaps ──────────────────
      // The merge may extend the range, which can uncover more same-name tags,
      // so repeat until the range stabilises.
      let changed = true;
      while (changed) {
        changed = false;
        const overlapping = findOverlappingTags(db, {
          startedAt: effectiveStart.toISOString(),
          endedAt: effectiveEnd.toISOString(),
        });

        for (const existing of overlapping) {
          if (existing.tagNameId !== createTagDto.tagNameId) continue;

          const existingStart = new Date(existing.startedAt);
          const existingEnd = new Date(existing.endedAt);
          const newStart = min([effectiveStart, existingStart]);
          const newEnd = max([effectiveEnd, existingEnd]);

          if (newStart < effectiveStart || newEnd > effectiveEnd) {
            effectiveStart = newStart;
            effectiveEnd = newEnd;
            changed = true;
          }

          deleteTag(db, { id: existing.id });
        }
      }

      // ── Pass 2: cut different-tagName overlaps ────────────────────────────
      const remainingOverlaps = findOverlappingTags(db, {
        startedAt: effectiveStart.toISOString(),
        endedAt: effectiveEnd.toISOString(),
      });

      for (const existing of remainingOverlaps) {
        if (existing.tagNameId === createTagDto.tagNameId) continue; // already handled

        const existingStart = new Date(existing.startedAt);
        const existingEnd = new Date(existing.endedAt);

        const coversLeft = existingStart < effectiveStart;
        const coversRight = existingEnd > effectiveEnd;

        if (coversLeft && coversRight) {
          // New tag sits entirely inside the old one → split old tag in two
          updateTagTime(
            db,
            { startedAt: existing.startedAt, endedAt: effectiveStart.toISOString() },
            { id: existing.id }
          );
          createTag(db, {
            id: uuid(),
            tagNameId: existing.tagNameId,
            startedAt: effectiveEnd.toISOString(),
            endedAt: existing.endedAt,
          });
        } else if (!coversLeft && !coversRight) {
          // Old tag sits entirely inside new tag → delete it
          deleteTag(db, { id: existing.id });
        } else if (coversLeft) {
          // Old tag starts before new tag, ends inside → trim its right side
          updateTagTime(
            db,
            { startedAt: existing.startedAt, endedAt: effectiveStart.toISOString() },
            { id: existing.id }
          );
        } else {
          // Old tag starts inside new tag, ends after → trim its left side
          updateTagTime(
            db,
            { startedAt: effectiveEnd.toISOString(), endedAt: existing.endedAt },
            { id: existing.id }
          );
        }
      }

      // ── Create the new (possibly merged) tag ─────────────────────────────
      id = uuid();
      await createTag(db, {
        id,
        tagNameId: createTagDto.tagNameId,
        startedAt: effectiveStart.toISOString(),
        endedAt: effectiveEnd.toISOString(),
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a tag entry in the database', err, {
        id,
        createTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    try {
      if (updateTagDto.tagNameId == null) {
        // Only time fields are being updated (e.g. from a resize drag)
        await updateTagTime(
          this.databaseService.getDb(),
          {
            startedAt: updateTagDto.startedAt,
            endedAt: updateTagDto.endedAt,
          },
          { id }
        );
      } else {
        await updateTag(
          this.databaseService.getDb(),
          {
            tagNameId: updateTagDto.tagNameId,
            startedAt: updateTagDto.startedAt,
            endedAt: updateTagDto.endedAt,
            note: null,
          },
          { id }
        );
      }

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update tag entry in the database', err, {
        id,
        updateTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await deleteTag(this.databaseService.getDb(), { id });
    } catch (err) {
      const error = new CustomError('Failed to delete tag entry from the database', err, { id });
      console.error(error);
      throw error;
    }
  }
}
