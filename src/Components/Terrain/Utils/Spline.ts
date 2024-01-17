export class CubicHermiteSpline {
  private _points: any[];
  private _lerp: any;

  constructor(lerp: any) {
    this._points = [];
    this._lerp = lerp;
  }

  AddPoint(t: number, d: number) {
    this._points.push([t, d]);
  }

  Get(t: number) {
    let p1 = 0;

    for (let i = 0; i < this._points.length; i++) {
      if (this._points[i][0] >= t) {
        break;
      }
      p1 = i;
    }

    const p0 = Math.max(0, p1 - 1);
    const p2 = Math.min(this._points.length - 1, p1 + 1);
    const p3 = Math.min(this._points.length - 1, p1 + 2);

    if (p1 == p2) {
      return this._points[p1][1];
    }

    return this._lerp(
      (t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]),
      this._points[p0][1],
      this._points[p1][1],
      this._points[p2][1],
      this._points[p3][1],
    );
  }
}

export class LinearSpline {
  private _points: any[];
  private _lerp: any;

  constructor(lerp: any) {
    this._points = [];
    this._lerp = lerp;
  }

  AddPoint(t: any, d: any) {
    this._points.push([t, d]);
  }

  Get(t: any) {
    let p1 = 0;

    for (let i = 0; i < this._points.length; i++) {
      if (this._points[i][0] >= t) {
        break;
      }
      p1 = i;
    }

    const p2 = Math.min(this._points.length - 1, p1 + 1);

    if (p1 == p2) {
      return this._points[p1][1];
    }

    return this._lerp(
      (t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]),
      this._points[p1][1],
      this._points[p2][1],
    );
  }
}
