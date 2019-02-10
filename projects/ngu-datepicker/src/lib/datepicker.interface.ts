export interface DpTest {
  day: string;
  isCurentMonth: boolean;
  date: string;
  compare: string;
}

export interface NguPickerData {
  arr: DpTest[][];
  extras: DpTerT;
}

export interface DpTerT {
  month: number;
  year: number;
  day: number;
  week: number;
}

export class DPColors {
  active: string[] = [];
  partil: string[] = [];
}
