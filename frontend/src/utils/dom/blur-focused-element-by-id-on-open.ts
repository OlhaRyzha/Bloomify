export const blurFocusedElementByIdOnOpen =
  (elementId: string) => (open: boolean) => {
    if (!open) return;

    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        activeElement.id === elementId
      ) {
        activeElement.blur();
      }
    });
  };
