import { Injectable } from '@angular/core';

export const range = (n: number) => [...Array(n).keys()]

export interface GR {
  arr: number[], // indizes der Gewinnreihe in das Spielfeld
  val: number,   // Wert der Gewinnreihe (8,4,1)
  cnt: number,   // Anzahl der Steine in Gewinnreihe
  occupiedBy: FieldOccupiedType // Von wem ist die Gewinnreihe belegt? 
}

export enum FieldOccupiedType { empty, human, computer, neutral };

export const DIM = { NCOL: 7, NROW: 6 };

@Injectable({
  providedIn: 'root'
})
export class VgModelStaticService {

  gr: GR[] = []; // Gewinnreihen
  grs: number[][] = []; // pro Feld eine Liste mit den Indizes auf die Gewinnreihen, die dieses Feld enthalten

  constructor() {
    this.initGRs();
  }

  private dump = () => {
    console.log("GR", this.gr)
    this.gr.forEach(o => console.log("gr: " + JSON.stringify(o)));
    this.grs.forEach((o, i) => console.log("grs: ", i, o));
  }

  berechneGRs = (r: number, c: number, dr: number, dc: number) => { // dr = delta row,  dc = delta col
    // horizontal gr is the best (8)
    // skew gr is quit good (4)
    // vertical gr is not so strong as horizontal or skew ones (1)
    const valOfGR = (dr: number, dc: number) => dr === 0 ? 8 : (dc !== 0 ? 4 : 0);

    const arr = [];
    while (r >= 0 && r < DIM.NROW && c >= 0 && c < DIM.NCOL) {
      arr.push(c + DIM.NCOL * r);
      if (arr.length === 4) {
        this.gr.push({ arr: arr, val: valOfGR(dr, dc), cnt: 0, occupiedBy: FieldOccupiedType.empty });
        return;
      }
      c += dc;
      r += dr;
    }
  }

  initGRs = () => {
    this.gr = [];
    range(DIM.NROW).forEach(r =>
      range(DIM.NCOL).forEach(c => {
        this.berechneGRs(r, c, 0, 1);
        this.berechneGRs(r, c, 1, 1);
        this.berechneGRs(r, c, 1, 0);
        this.berechneGRs(r, c, -1, 1);
      })
    )

    range(DIM.NCOL * DIM.NROW).forEach(i => {
      this.grs[i] = this.gr.reduce((acc: number[], g: GR, j: number) => g.arr.includes(i) ? [...acc, j] : acc, []);
    })
  }
}
