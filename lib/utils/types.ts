/**
 * Type definitions for the AI Note System
 */

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteWithOwner extends Note {
  owner?: {
    username: string;
    display_name: string | null;
  };
}

export interface NoteEmbedding {
  id: string;
  note_id: string;
  user_id: string;
  chunk_text: string;
  embedding: number[];
  chunk_index: number;
  created_at: string;
}

export interface TextChunk {
  text: string;
  index: number;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  index: number;
}

export interface VectorSearchResult {
  note_id: string;
  chunk_text: string;
  similarity: number;
  note?: Note;
  is_own_note?: boolean;
  owner_username?: string;
}

// Database table types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      note_embeddings: {
        Row: NoteEmbedding;
        Insert: Omit<NoteEmbedding, 'id' | 'created_at'>;
        Update: Partial<Omit<NoteEmbedding, 'id' | 'note_id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface NoteResponse {
  note: Note;
}

