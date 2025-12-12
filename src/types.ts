export interface Model {
    id: string;
    name: string;
    provider: string;
    description: string;
    contextLength: number;
    contextLengthFormatted: string | null;
    maxOutput: number;
    maxOutputFormatted: string | null;
    inputPrice: number;
    outputPrice: number;
    modality: string;
    inputModalities: string[];
    outputModalities: string[];
    openRouterUrl: string;
    createdAt: string | null;
}

export interface ModelsData {
    updatedAt: string;
    totalCount: number;
    models: Model[];
}

export type SortField =
    | 'name'
    | 'provider'
    | 'contextLength'
    | 'maxOutput'
    | 'inputPrice'
    | 'outputPrice';

export type SortDirection = 'asc' | 'desc';
