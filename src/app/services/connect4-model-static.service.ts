import { Injectable } from '@angular/core';

export const range = (n: number) => [...Array(n).keys()]
export enum FieldOccupiedType { empty, human, ai, neutral };
export const DIM = { NCOL: 7, NROW: 6 };
export type WinningRow = {
  row: number[],                // indices of winning row on board
  score: number,                // score of winining row (8 or 4 or 1)
  cnt: number,                  // count of tiles in winning row 
  occupiedBy: FieldOccupiedType // who is occupying winning row 
}

@Injectable({ providedIn: 'root' })
export class ConnectFourModelStaticService {
  allWinningRows: WinningRow[] = []; // winning rows - length should be 69 for DIM (7x6)
  winningRowsForFields: number[][] = []; // list of indices on allWinningRows for each field of board

  constructor() {
    this.allWinningRows = range(DIM.NROW).reduce((acc: WinningRow[], r: number) => range(DIM.NCOL).reduce((acc: WinningRow[], c: number) => [
      ...acc,
      ...this.computeWinningRows(r, c, 0, 1),
      ...this.computeWinningRows(r, c, 1, 1),
      ...this.computeWinningRows(r, c, 1, 0),
      ...this.computeWinningRows(r, c, -1, 1)
    ], acc), [])
    this.winningRowsForFields = range(DIM.NCOL * DIM.NROW).map(i => this.allWinningRows.reduce((acc: number[], r: WinningRow, j: number) => r.row.includes(i) ? [...acc, j] : acc, []))
  }

  computeWinningRows = (r: number, c: number, dr: number, dc: number): WinningRow[] => { // dr = delta row,  dc = delta col
    const row = [];
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL && row.length < 4) { row.push(c + DIM.NCOL * r); c += dc; r += dr; }
    return row.length < 4 ? [] : [{
      row,
      score: dr === 0 ? 8 : (dc !== 0 ? 4 : 1), // horizontal is the best (8) skew is quit good (4) vertical is not so strong as horizontal or skew ones (1)
      cnt: 0,
      occupiedBy: FieldOccupiedType.empty
    }];
  }
}
