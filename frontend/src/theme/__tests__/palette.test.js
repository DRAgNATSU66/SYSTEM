import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rgbVar, toRgba } from '../paletteCore.js';

test('rgbVar without alpha', () => assert.equal(rgbVar('--accent-rgb'), 'rgb(var(--accent-rgb))'));
test('rgbVar with alpha', () => assert.equal(rgbVar('--accent-rgb', 0.2), 'rgb(var(--accent-rgb) / 0.2)'));
test('toRgba converts channels', () => assert.equal(toRgba('0 191 255', 0.2), 'rgba(0, 191, 255, 0.2)'));
test('toRgba defaults alpha 1', () => assert.equal(toRgba(' 255 255 255 '), 'rgba(255, 255, 255, 1)'));
