import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

declare const require: any;

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Load all the specs
// Explicitly load the leaderboard specs added by this change.
import './app/features/leaderboard/top3-cards.component.spec';
import './app/features/leaderboard/leaderboard-table.component.spec';
import './app/features/leaderboard/leaderboard.service.spec';
