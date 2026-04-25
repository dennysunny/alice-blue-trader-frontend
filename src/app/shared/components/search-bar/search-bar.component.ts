import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';

import { takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { APP_CONSTANTS } from '../../../core/configs/api.config';

@Component({
  standalone: false,
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search symbols…';
  @Input() minLength = 2;

  @Output() searched = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  readonly control = new FormControl('');
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.trackControlValueChanges();
  }

  trackControlValueChanges(): void {
    this.control.valueChanges
      .pipe(
        debounceTime(APP_CONSTANTS.DEBOUNCE_SEARCH_MS),
        distinctUntilChanged(),
        filter((v) => !v || v.trim().length >= this.minLength),
        takeUntil(this.destroy$),
      )
      .subscribe((v) => {
        if (v?.trim()) this.searched.emit(v.trim());
        else this.cleared.emit();
      });
  }

  clear(): void {
    this.control.setValue('');
    this.cleared.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
