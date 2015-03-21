/**
 * HProj is the common interface for HClient and HServer to provide
 * access to a database tagged entity records.
 * @see {@link http://project-haystack.org/doc/TagModel|Project Haystack}

 * @constructor
 */
function HProj() {}
module.exports = HProj;

/** Abstract functions that must be defined in inheriting classes
 * about(): HDict - Get the summary "about" information.
 * onReadById(HRef): HDict - Subclass hook for readById, return null if not found.
 * onReadByIds(HRef[]): HGrid - Subclass hook for readByIds, return rows with nulls cells for each id not found.
 * onReadAll(String, int): HGrid - Subclass hook for read and readAll.
 * watchOpen(String, HNum): HWatch - Create a new watch with an empty subscriber list.  The dis string is a debug string to keep track of who created the watch. Pass the desired lease time or null to use default.
 * watches(): HWatch[] - List the open watches.
 * watch(String, boolean checked): HWatch - if 'checked' is undefined, default to true. Lookup a watch by its unique identifier.  If not found then raise Error or return null based on checked flag.
 * hisRead(HRef, Object): HGrid - Read history time-series data for given record and time range. The items returned are exclusive of start time and inclusive of end time.
 *     Raise exception if id does not map to a record with the required tags "his" or "tz".  The range may be either a String or a HDateTimeRange. If HTimeDateRange is passed then must match the timezone configured on
 *     the history record.  Otherwise if a String is passed, it is resolved relative to the history record's timezone.
 * hisWrite(HRef, HHisItem[]): void - Write a set of history time-series data to the given point record. The record must already be defined and must be properly tagged as
 *     a historized point.  The timestamp timezone must exactly match the point's configured "tz" tag.  If duplicate or out-of-order items are inserted then they must be gracefully merged.
 */

/**
 * Call "read" to lookup an entity record by it's unique identifier.
 * If not found then return null or throw an UnknownRecException based
 * on checked.
 * @param {HRef} id
 * @param {boolean} checked
 * @param {function} callback
 * @return {HDict}
 */
HProj.prototype.readById = function(id, checked, callback) {
  if (typeof(checked)==='function') {
    callback = checked;
    checked = true;
  }

  this.onReadById(id, function(err, rec) {
    if (typeof(rec) !== 'undefined' && rec !== null) {
      callback(null, rec);
      return;
    }
    if (checked) {
      callback(new Error("Unknown Rec: " + id));
      return;
    }
    callback(null, null);
  });
};

/**
 * Read a list of entity records by their unique identifier.
 * Return a grid where each row of the grid maps to the respective
 * id array (indexes line up).  If checked is true and any one of the
 * ids cannot be resolved then raise UnknownRecException for first id
 * not resolved.  If checked is false, then each id not found has a
 * row where every cell is null.
 * @param {HRef[]} ids
 * @param {boolean} checked
 * @param {function} callback
 * @return {HGrid}
 */
HProj.prototype.readByIds = function(ids, checked, callback) {
  if (typeof(checked)==='function') {
    callback = checked;
    checked = true;
  }

  this.onReadByIds(ids, function(err, grid) {
    if (checked) {
      for (var i = 0; i < grid.numRows(); ++i) {
        if (grid.row(i).missing("id")) {
          callback(new Error("Unknown Rec: " + ids[i]));
          return;
        }
      }
    }
    callback(null, grid);
  });
};

/**
 * Query one entity record that matches the given filter.  If
 * there is more than one record, then it is undefined which one is
 * returned.  If there are no matches than return null or raise
 * UnknownRecException based on checked flag.
 * @param {string} filter
 * @param {boolean} checked
 * @param {function} callback
 * @return {HDict}
 */
HProj.prototype.read = function(filter, checked, callback) {
  if (typeof(checked)==='function') {
    callback = checked;
    checked = true;
  }

  this.readAll(filter, 1, function(err, grid) {
    if (err) {
      callback(err);
      return
    }
    if (grid.numRows() > 0) {
      callback(null, grid.row(0));
      return;
    }
    if (checked) {
      callback(new Error("Unknown Rec: " + filter));
      return;
    }
    callback(null, null);
  });
};

/**
 * Call "read" to query every entity record
 * that matches given filter. Clip number of results by "limit" parameter.
 * @param {string} filter
 * @param {int} limit
 * @param {function} callback
 * @return {HGrid}
 */
HProj.prototype.readAll = function(filter, limit, callback) {
  if (typeof(limit)==='function') {
    callback = limit;
    limit = 2147483647;
  }

  this.onReadAll(filter, limit, callback);
};
