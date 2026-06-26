import { CreateAutoNoteDto } from './dto/create-auto-note.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CustomError } from '../shared/CustomError';
import { v4 as uuid } from 'uuid';
import { type AutoNote, ConditionVariable } from '../types/types';
import { UpdateAutoNoteDto } from './dto/update-auto-note.dto';
import { countAutoNotes } from './queries/countAutoNotes';
import { createAutoNote } from './queries/createAutoNote';
import { deleteAutoNote } from './queries/deleteAutoNote';
import { findAllAutoNotes } from './queries/findAllAutoNotes';
import {
  findAllAutoNotesBySearchTerm,
  FindAllAutoNotesBySearchTermResult,
} from './queries/findAllAutoNotesBySearchTerm';
import { FindAllAutoNotesResult } from './queries/findAllAutoNotes';
import { findOneAutoNote, FindOneAutoNoteResult } from './queries/findOneAutoNote';
import { updateAutoNote } from './queries/updateAutoNote';

const TAG_NAME_IDS_SEPARATOR = ';';

@Injectable()
export class AutoNotesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(
    rawAutoNote: FindAllAutoNotesResult | FindAllAutoNotesBySearchTermResult | FindOneAutoNoteResult
  ): AutoNote {
    return {
      id: rawAutoNote.id,
      title: rawAutoNote.title,
      tagNameIds: rawAutoNote.tagNameId ? rawAutoNote.tagNameId.split(TAG_NAME_IDS_SEPARATOR) : [],
      variable: rawAutoNote.variable as ConditionVariable,
      extractRegex: rawAutoNote.extractRegex,
      extractRegexReplacement: rawAutoNote.extractRegexReplacement,
    };
  }

  async findAll(searchTerm: string | undefined): Promise<AutoNote[]> {
    try {
      const db = this.databaseService.getDb();
      let rawAutoNotes: FindAllAutoNotesResult[] | FindAllAutoNotesBySearchTermResult[];
      if (searchTerm) {
        rawAutoNotes = findAllAutoNotesBySearchTerm(db, { searchTerm });
      } else {
        rawAutoNotes = findAllAutoNotes(db);
      }

      return rawAutoNotes.map((note) => this.adapt(note));
    } catch (err) {
      const error = new CustomError('Failed to fetch all auto-notes from the database', err, {
        searchTerm,
      });
      console.error(error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = countAutoNotes(db);

      return result?.count ?? 0;
    } catch (err) {
      const error = new CustomError('Failed to count auto-notes in the database', err, {});
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<AutoNote> {
    try {
      const db = this.databaseService.getDb();
      const result = findOneAutoNote(db, { id });

      return this.adapt(result);
    } catch (err) {
      const error = new CustomError('Failed to fetch one auto-note from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(autoNote: CreateAutoNoteDto): Promise<AutoNote> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();
      id = uuid();
      createAutoNote(db, {
        id,
        title: autoNote.title,
        tagNameId: autoNote.tagNameIds ? autoNote.tagNameIds.join(TAG_NAME_IDS_SEPARATOR) : null,
        variable: autoNote.variable,
        extractRegex: autoNote.extractRegex ?? null,
        extractRegexReplacement: autoNote.extractRegexReplacement ?? null,
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create an auto-note entry in the database', err, {
        id,
        autoNote,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateTagDto: UpdateAutoNoteDto): Promise<AutoNote> {
    try {
      const db = this.databaseService.getDb();
      updateAutoNote(
        db,
        {
          title: updateTagDto.title,
          tagNameId: updateTagDto.tagNameIds
            ? updateTagDto.tagNameIds.join(TAG_NAME_IDS_SEPARATOR)
            : null,
          variable: updateTagDto.variable,
          extractRegex: updateTagDto.extractRegex ?? null,
          extractRegexReplacement: updateTagDto.extractRegexReplacement ?? null,
        },
        { id }
      );

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update auto-note entry in the database', err, {
        id,
        updateTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const db = this.databaseService.getDb();
      deleteAutoNote(db, { id });
    } catch (err) {
      const error = new CustomError('Failed to delete auto-note entry from the database', err, {
        id,
      });
      console.error(error);
      throw error;
    }
  }
}
