(() => {
  const root = document.documentElement;

  const syncTheme = () => {
    const body = document.body;
    if (!body) return false;
    const isDark = root.classList.contains("dark");
    root.dataset.theme = isDark ? "dark" : "light";
    body.classList.toggle("theme-dark", isDark);
    return true;
  };

  const patchSearchClear = () => {
    const form = document.querySelector("#changelist-search");
    const input = form?.querySelector("input[name='q']");
    if (!form || !input) return;

    input.type = "text";
    const shortcut = form.querySelector("kbd");
    if (shortcut) shortcut.style.display = "none";

    const wrapper = input.closest(".relative") || input.parentElement;
    if (!wrapper) return;

    if (!wrapper.querySelector(".bloomify-search-clear-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bloomify-search-clear-btn";
      btn.setAttribute("aria-label", "Очистити пошук");
      btn.innerHTML = "&times;";
      btn.addEventListener("click", () => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        form.requestSubmit();
      });
      wrapper.appendChild(btn);
    }

    const btn = wrapper.querySelector(".bloomify-search-clear-btn");
    const toggle = () => {
      if (btn) btn.style.display = input.value?.trim() ? "inline-flex" : "none";
    };

    if (!input.dataset.bloomifySearchBound) {
      let debounceTimer;
      input.addEventListener("input", () => {
        toggle();
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => form.requestSubmit(), 350);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          input.value = "";
          toggle();
          window.clearTimeout(debounceTimer);
          form.requestSubmit();
        }
      });
      input.dataset.bloomifySearchBound = "1";
    }

    toggle();
  };

  const updatePaginationSelectedCounter = (count) => {
    const paginationBar =
      document.querySelector(".lg\\:scrollable-top") ||
      document.querySelector("[class*='scrollable-top']") ||
      document.querySelector(".paginator")?.closest("div") ||
      document.querySelector("footer .px-4");

    if (!paginationBar) return;

    let textNode = paginationBar.querySelector(".bloomify-selected-counter");
    if (!textNode) {
      textNode = document.createElement("span");
      textNode.className = "bloomify-selected-counter";
      paginationBar.appendChild(textNode);
    }

    if (count <= 0) {
      textNode.textContent = "";
      return;
    }

    const nativeCounterText = document
      .querySelector("#changelist-form .actions .action-counter")
      ?.textContent?.trim();

    if (nativeCounterText && /\d/.test(nativeCounterText)) {
      textNode.textContent = nativeCounterText.replace(/\d+/, String(count));
    } else {
      textNode.textContent = `Selected: ${count}`;
    }
  };

  const patchBulkActionsTopbar = () => {
    const toolbar = document.querySelector("#toolbar");
    const changelistForm = document.querySelector("#changelist-form");
    const originalActions = document.querySelector("#changelist-form .actions");
    const originalSelect = originalActions?.querySelector("select[name='action']");
    if (!toolbar || !changelistForm || !originalActions || !originalSelect) return;

    const storageKey = `bloomify:selected:${location.pathname}`;

    const readStored = () => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
      } catch {
        return new Set();
      }
    };

    const writeStored = (set) => {
      sessionStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    };

    const clearStored = () => {
      sessionStorage.removeItem(storageKey);
    };

    const resetSelectionState = () => {
      changelistForm
        .querySelectorAll("input.action-select[type='checkbox'], input[name='_selected_action'][type='checkbox']")
        .forEach((cb) => {
          cb.checked = false;
        });
      const masterCheckbox = changelistForm.querySelector("#action-toggle");
      if (masterCheckbox) masterCheckbox.checked = false;
      originalSelect.value = "";
      const customSelect = toolbar.querySelector(".bloomify-bulk-select");
      if (customSelect) customSelect.value = "";
      clearStored();
    };

    const navEntry = performance.getEntriesByType?.("navigation")?.[0];
    const isHardReload = navEntry?.type === "reload";
    if (isHardReload) {
      resetSelectionState();
    }

    originalActions.classList.add("bloomify-bulk-native-hidden");

    let customWrap = toolbar.querySelector(".bloomify-bulk-topbar");
    if (!customWrap) {
      customWrap = document.createElement("div");
      customWrap.className = "bloomify-bulk-topbar";

      const customSelect = document.createElement("select");
      customSelect.className = "bloomify-bulk-select";

      const originalLabel = originalActions.querySelector("label");
      const labelTextNode = Array.from(originalLabel?.childNodes || []).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );
      const originalLabelText = labelTextNode?.textContent?.trim() || "Actions";
      const bulkActionLabel = /^action:?$/i.test(originalLabelText)
        ? "Actions"
        : originalLabelText.replace(/:$/, "");

      customSelect.setAttribute("aria-label", bulkActionLabel);

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = bulkActionLabel;
      customSelect.appendChild(placeholder);

      const originalDeleteOption = Array.from(originalSelect.options).find(
        (opt) => opt.value === "delete_selected"
      );

      if (originalDeleteOption) {
        const deleteOption = document.createElement("option");
        deleteOption.value = originalDeleteOption.value;
        deleteOption.textContent = originalDeleteOption.textContent || originalDeleteOption.innerText;
        customSelect.appendChild(deleteOption);
      }

      customSelect.addEventListener("change", () => {
        if (!customSelect.value) return;
        originalSelect.value = customSelect.value;
        clearStored();
        changelistForm.requestSubmit();
      });

      customWrap.appendChild(customSelect);
      toolbar.appendChild(customWrap);
    }

    const rowCheckboxes = () =>
      Array.from(
        changelistForm.querySelectorAll("tbody input.action-select[type='checkbox'], tbody input[name='_selected_action'][type='checkbox']")
      );

    const applyStoredToCurrentPage = () => {
      const selected = readStored();
      rowCheckboxes().forEach((cb) => {
        cb.checked = selected.has(String(cb.value));
      });
    };

    const syncStoredFromCurrentPage = () => {
      const selected = readStored();
      rowCheckboxes().forEach((cb) => {
        const id = String(cb.value);
        if (cb.checked) selected.add(id);
        else selected.delete(id);
      });
      writeStored(selected);
      return selected.size;
    };

    const refresh = () => {
      const checkedCount = readStored().size;
      const hasChecked = checkedCount > 0;
      customWrap.style.display = hasChecked ? "inline-flex" : "none";
      if (!hasChecked) {
        const customSelect = customWrap.querySelector(".bloomify-bulk-select");
        if (customSelect) customSelect.value = "";
        originalSelect.value = "";
      }
      updatePaginationSelectedCounter(checkedCount);
    };

    applyStoredToCurrentPage();

    if (!changelistForm.dataset.bloomifyBulkBound) {
      changelistForm.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

        if (target.id === "action-toggle") {
          // wait until Django toggles row checkboxes
          requestAnimationFrame(() => {
            syncStoredFromCurrentPage();
            refresh();
          });
          return;
        }

        syncStoredFromCurrentPage();
        refresh();
      });

      window.addEventListener("pageshow", () => {
        applyStoredToCurrentPage();
        refresh();
      });

      changelistForm.dataset.bloomifyBulkBound = "1";
    }

    refresh();
  };

  const syncPermissionMaster = (master) => {
    const groupId = master.dataset.bloomifyPermissionMaster;
    const children = Array.from(
      document.querySelectorAll(
        `input[data-bloomify-permission-child="${groupId}"]`
      )
    );
    const checkedCount = children.filter((child) => child.checked).length;

    master.checked = children.length > 0 && checkedCount === children.length;
    master.indeterminate = checkedCount > 0 && checkedCount < children.length;
  };

  const patchPermissionMatrix = () => {
    const masters = Array.from(
      document.querySelectorAll("input[data-bloomify-permission-master]")
    );

    if (!masters.length) return;

    masters.forEach((master) => {
      if (!master.dataset.bloomifyPermissionBound) {
        master.addEventListener("change", () => {
          const groupId = master.dataset.bloomifyPermissionMaster;
          document
            .querySelectorAll(`input[data-bloomify-permission-child="${groupId}"]`)
            .forEach((child) => {
              child.checked = master.checked;
            });
          syncPermissionMaster(master);
        });
        master.dataset.bloomifyPermissionBound = "1";
      }

      syncPermissionMaster(master);
    });

    document
      .querySelectorAll("input[data-bloomify-permission-child]")
      .forEach((child) => {
        if (child.dataset.bloomifyPermissionBound) return;

        child.addEventListener("change", () => {
          const master = document.querySelector(
            `input[data-bloomify-permission-master="${child.dataset.bloomifyPermissionChild}"]`
          );
          if (master) syncPermissionMaster(master);
        });
        child.dataset.bloomifyPermissionBound = "1";
      });
  };

  const patchDatetimeWarnings = () => {
    document.querySelectorAll("p.datetime").forEach((datetime) => {
      const dateInput = datetime.querySelector(".vDateField");
      const timeInput = datetime.querySelector(".vTimeField");
      const warning = datetime.querySelector(".timezonewarning");
      const dateLabel = dateInput
        ? datetime.querySelector(`label[for="${dateInput.id}"]`)
        : null;
      const timeLabel = timeInput
        ? datetime.querySelector(`label[for="${timeInput.id}"]`)
        : null;
      const dateShortcuts =
        dateInput?.nextElementSibling?.classList?.contains("datetimeshortcuts")
          ? dateInput.nextElementSibling
          : null;
      const timeShortcuts =
        timeInput?.nextElementSibling?.classList?.contains("datetimeshortcuts")
          ? timeInput.nextElementSibling
          : null;

      if (
        !dateInput ||
        !timeInput ||
        !dateLabel ||
        !timeLabel ||
        !dateShortcuts ||
        !timeShortcuts ||
        !warning
      ) {
        return;
      }

      if (datetime.dataset.bloomifyDatetimePatched === "1") {
        warning.classList.add("bloomify-timezone-warning");
        return;
      }

      const dateRow = document.createElement("span");
      dateRow.className = "bloomify-datetime-row bloomify-datetime-row--date";
      dateRow.append(dateLabel, dateInput, dateShortcuts);

      const warningRow = document.createElement("span");
      warningRow.className = "bloomify-datetime-warning-row";
      warning.classList.add("bloomify-timezone-warning");
      warningRow.append(warning);

      const timeRow = document.createElement("span");
      timeRow.className = "bloomify-datetime-row bloomify-datetime-row--time";
      timeRow.append(timeLabel, timeInput, timeShortcuts);

      while (datetime.firstChild) {
        datetime.removeChild(datetime.firstChild);
      }

      datetime.append(dateRow, timeRow, warningRow);
      datetime.dataset.bloomifyDatetimePatched = "1";
    });
  };

  const initObserver = () => {
    if (!window.MutationObserver) return;
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === "class")) syncTheme();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    const datetimeObserver = new MutationObserver(() => {
      patchDatetimeWarnings();
    });
    datetimeObserver.observe(document.body, { childList: true, subtree: true });
  };

  const start = () => {
    if (!syncTheme()) return requestAnimationFrame(start);
    patchSearchClear();
    patchBulkActionsTopbar();
    patchPermissionMatrix();
    patchDatetimeWarnings();
    window.setTimeout(patchDatetimeWarnings, 100);
    initObserver();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
