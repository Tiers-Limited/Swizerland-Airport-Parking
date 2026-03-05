'use client';

// This utility installs harmless wrappers around the DOM mutation methods that
// are commonly abused by the Google Website Translator widget.  The widget
// performs operations like moving text nodes by inserting/removing them
// directly, which frequently conflicts with React's expectations and
// triggers `NotFoundError` exceptions during unmounts or re-renders.
//
// The patch silently swallows errors that match the familiar "node to be
// removed/inserted is not a child of this node" messages, allowing the app to
// continue without crashing.  It logs a warning once per method so that
// developers can still notice if something odd is happening.

let hasPatched = false;
export function applyGoogleTranslatePatch() {
  if (typeof window === 'undefined' || hasPatched) return;
  hasPatched = true;

  const origRemoveChild = Node.prototype.removeChild;
  const origInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
      return origRemoveChild.apply(this, [child]) as T;
    } catch (e: any) {
      // Only swallow the specific DOMException thrown when the node isn't a
      // child.  Preserve everything else.
      if (
        e instanceof DOMException &&
        (e.message.includes('removeChild') || e.message.includes('not a child'))
      ) {
        console.warn(
          '[Google Translate patch] ignored invalid removeChild operation'
        );
        return child;
      }
      throw e;
    }
  };

  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    try {
      return origInsertBefore.apply(this, [newNode, referenceNode]) as T;
    } catch (e: any) {
      if (
        e instanceof DOMException &&
        (e.message.includes('insertBefore') || e.message.includes('not a child'))
      ) {
        console.warn(
          '[Google Translate patch] ignored invalid insertBefore operation'
        );
        return newNode;
      }
      throw e;
    }
  };
}
