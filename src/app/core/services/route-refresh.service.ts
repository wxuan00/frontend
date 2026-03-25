import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RouteRefreshService {
  private _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  trigger() {
    this._refresh$.next();
  }
}
