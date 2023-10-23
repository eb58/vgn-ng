import { Injectable } from '@angular/core';

const range = (n:number) => [...Array(n).keys()]

export interface GR{
 arr:number [],
 val:number, // Wert der Gewinnreihe 
 cnt: number, // 
 occupiedBy: number
}

@Injectable({
  providedIn: 'root'
})
export class VgModelStaticService {

  DIM = { NCOL: 7, NROW: 6 };
  STYP = { empty: 0, player1: 1, player2: 2, neutral: 3 };
  gr: GR[] = []; // Gewinnreihen
  grs:number[][] = []; // Gewinnreihen pro Feld  

  constructor() { 
    this.initGRs();
  }

  dump = () => {
    console.log("GR",     this.gr )
    this.gr.forEach(o => console.log("gr: " + JSON.stringify(o)));
    this.grs.forEach((o, i) => console.log("grs: ", i, o));
  }

   berechneGRs = (r:number, c:number, dr:number, dc:number) => { // dr = delta row,  dc = delta col
    // horizontal gr is the best (8)
    // skew gr is quit good (4)
    // vertical gr is not so strong as horizontal or skew ones (1)
    const valOfGR = (dr:number, dc:number) => dr === 0 ? 8 : (dc !== 0 ? 4 : 1);

    const arr = [];
    while (r >= 0 && r < this.DIM.NROW && c >= 0 && c < this.DIM.NCOL) {
      arr.push(c + this.DIM.NCOL * r);
      if (arr.length === 4) {
        this.gr.push({ arr: arr, val: valOfGR(dr, dc), cnt:0, occupiedBy:0 });
        return;
      }
      c += dc;
      r += dr;
    }
  }

   initGRs = () => {
    range(this.DIM.NROW).forEach(r => {
      range(this.DIM.NCOL).forEach(c => {
        this.berechneGRs(r, c, 0, 1);
        this.berechneGRs(r, c, 1, 1);
        this.berechneGRs(r, c, 1, 0);
        this.berechneGRs(r, c, -1, 1);
      })
    })

    range(this.DIM.NCOL * this.DIM.NROW).forEach(i => {
      this.grs[i] = this.gr.reduce((acc:number[], g:GR, j:number) => g.arr.includes(i) ? [...acc, j] : acc, []);
    })
    // this.dump();
  }

  // debug and test

  /*const equal = (a1, a2) => a1.every((x, i) => x === a2[i])

  const internalTests = () => gr.length === 69
    && equal(gr[0].arr, [0, 1, 2, 3])
    && equal(gr[1].arr, [0, 8, 16, 24])
    && equal(grs[0], [0, 1, 2])
    && equal(grs[1], [0, 3, 4, 5]);
*/

}
