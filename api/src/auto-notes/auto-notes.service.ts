import { CreateAutoNoteDto } from './dto/create-auto-note.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { type AutoNote, ConditionVariable } from '../types/types';
import { UpdateAutoNoteDto } from './dto/update-auto-note.dto';
import {
  countAutoNotes,
  createAutoNote,
  deleteAutoNote,
  findAllAutoNotes,
  findAllAutoNotesBySearchTerm,
  FindAllAutoNotesResult,
  FindAllAutoNotesBySearchTermResult,
  FindOneAutoNoteResult,
  findOneAutoNote,
  updateAutoNote,
} from './queries/index.js';

const TAG_NAME_IDS_SEPARATOR = ';';

@Injectable()
export class AutoNotesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(
    rawAutoNote: FindAllAutoNotesResult | FindAllAutoNotesBySearchTermResult | FindOneAutoNoteResult
  ): AutoNote {
    return {
      id: rawAutoNote.id,
      name: rawAutoNote.title,
      tagNameIds: rawAutoNote.tagNameId ? rawAutoNote.tagNameId.split(TAG_NAME_IDS_SEPARATOR) : [],
      variable: rawAutoNote.variable as ConditionVariable,
      extractRegex: rawAutoNote.extractRegex,
      extractRegexReplacement: rawAutoNote.extractRegexReplacement,
    };
  }

  async findAll(searchTerm: string | undefined): Promise<AutoNote[]> {
    const db = this.databaseService.getDb();
    let rawAutoNotes: FindAllAutoNotesResult[] | FindAllAutoNotesBySearchTermResult[];
    if (searchTerm) {
      rawAutoNotes = findAllAutoNotesBySearchTerm(db, { searchTerm });
    } else {
      rawAutoNotes = findAllAutoNotes(db);
    }

    return rawAutoNotes.map((note) => this.adapt(note));
  }

  async count(): Promise<number> {
    const db = this.databaseService.getDb();
    const result = countAutoNotes(db);

    return result?.count ?? 0;
  }

  async findOne(id: string): Promise<AutoNote> {
    const db = this.databaseService.getDb();
    const result = findOneAutoNote(db, { id });

    return this.adapt(result);
  }

  async create(autoNote: CreateAutoNoteDto): Promise<AutoNote> {
    const db = this.databaseService.getDb();
    const id = uuid();
    createAutoNote(db, {
      id,
      title: autoNote.name,
      tagNameId: autoNote.tagNameIds ? autoNote.tagNameIds.join(TAG_NAME_IDS_SEPARATOR) : null,
      variable: autoNote.variable,
      extractRegex: autoNote.extractRegex ?? null,
      extractRegexReplacement: autoNote.extractRegexReplacement ?? null,
    });

    return this.findOne(id);
  }

  async update(id: string, updateTagDto: UpdateAutoNoteDto): Promise<AutoNote> {
    const db = this.databaseService.getDb();
    updateAutoNote(
      db,
      {
        title: updateTagDto.name,
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
  }

  async remove(id: string): Promise<void> {
    const db = this.databaseService.getDb();
    deleteAutoNote(db, { id });
  }
}
