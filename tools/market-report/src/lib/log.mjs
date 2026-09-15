/**
 * Source status tracking. Every source reports back what happened so the report can
 * state plainly which feed answered, which fell back, and which failed — the run
 * never aborts because one source is down.
 */

/**
 * @typedef {Object} SourceStatus
 * @property {string} id
 * @property {string} label
 * @property {'ok'|'partial'|'failed'} state
 * @property {string} detail
 * @property {string} [note]
 * @property {number} ms
 */

export class SourceLog {
  constructor() {
    /** @type {SourceStatus[]} */
    this.entries = [];
  }

  /**
   * @param {{ id: string, label: string, state: 'ok'|'partial'|'failed', detail: string, note?: string, ms?: number }} entry
   */
  add(entry) {
    this.entries.push({
      id: entry.id,
      label: entry.label,
      state: entry.state,
      detail: entry.detail,
      note: entry.note,
      ms: entry.ms ?? 0,
    });
  }

  /** Mark a source as failed with an error string. */
  fail(id, label, error, ms = 0) {
    this.add({ id, label, state: 'failed', detail: String(error), ms });
  }

  /** @returns {SourceStatus[]} */
  all() {
    return this.entries;
  }

  /** Count of sources that returned usable data (fully or via a documented fallback). */
  okCount() {
    return this.entries.filter((e) => e.state !== 'failed').length;
  }

  /** One-line machine-readable status used by the auto-summary. */
  summaryLine() {
    return this.entries.map((e) => `${e.label}: ${e.state}`).join(' | ');
  }
}