export interface Arg {
  name: string;
  required?: boolean;
  description?: string;
  rest: boolean;
}

export interface FunctionData {
  name: string;
  category: string;
  description: string;
  version?: string;
  brackets?: boolean;
  args?: Arg[];
  _source?: 'ForgeScript' | 'ForgeDB' | 'ForgeCanvas' | string;
}

export interface EventData {
  name: string;
  description?: string;
  version?: string;
  _source?: 'ForgeScript' | 'ForgeDB' | string;
}