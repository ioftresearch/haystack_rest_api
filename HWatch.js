/**
 * HWatch models a subscription to a list of entity records.
 * Use HProj.watchOpen to create a new watch.
 * @see {@link http://project-haystack.org/doc/Rest@watches|Project Haystack}
 *
 * @constructor
 */
function HWatch() {}
module.exports = HWatch;

/**
 * Unique watch identifier within a project database. The id may not be assigned until
 * after the first call to "sub", in which case return null.
 * @abstract
 * @return {string}
 */
HWatch.prototype.id = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Debug display string used during "HProj.watchOpen"
 * @abstract
 * @return {string}
 */
HWatch.prototype.dis = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Lease period or null if watch has not been opened yet.
 * @abstract
 * @return {HNum}
 */
HWatch.prototype.lease = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * if 'checked' is undefined, default to true. Add a list of records to the subscription list and
 * return their current representation.  If checked is true and any one of the ids cannot be resolved
 * then raise UnknownRecException for first id not resolved.  If checked is false, then each id not found
 * has a row where every cell is null. The HGrid that is returned must contain metadata entries for
 * 'watchId' and 'lease'.
 * @abstract
 * @param {HRef[]} ids
 * @param {boolean} checked
 * @return {string}
 */
HWatch.prototype.sub = function(ids, checked) {
  throw new Error('must be implemented by subclass!');
};
/**
 * Remove a list of records from watch.  Silently ignore any invalid ids.
 * @abstract
 * @param {HRef[]} ids
 * @return {string}
 */
HWatch.prototype.unsub = function(ids) {
  throw new Error('must be implemented by subclass!');
};
/**
 * Poll for any changes to the subscribed records.
 * @abstract
 * @return {HGrid}
 */
HWatch.prototype.pollChanges = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Poll all the subscribed records even if there have been no changes.
 * @abstract
 * @return {HGrid}
 */
HWatch.prototype.pollRefresh = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Close the watch and free up any state resources.
 * @abstract
 */
HWatch.prototype.close = function() {
  throw new Error('must be implemented by subclass!');
};
/**
 * Return whether this watch is currently open.
 * @abstract
 * @return {boolean}
 */
HWatch.prototype.isOpen = function() {
  throw new Error('must be implemented by subclass!');
};
