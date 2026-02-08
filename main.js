document.body.classList.add("js");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


window.setupBlogPostToggles = function (list) {
  if (!list) return;
  list.querySelectorAll(".blog-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.post;
      const contentEl = list.querySelector(`[data-content='${id}']`);
      if (!contentEl) return;
      contentEl.classList.toggle("open");
      button.textContent = contentEl.classList.contains("open") ? "Close" : "Read";
    });
  });
};


const adminToggle = document.getElementById("admin-toggle");
const adminPanel = document.getElementById("admin-panel");
const adminClose = document.getElementById("admin-close");

if (adminToggle && adminPanel) {
  adminToggle.addEventListener("click", () => {
    adminPanel.hidden = false;
    adminPanel.style.display = "grid";
  });
}

if (adminClose && adminPanel) {
  adminClose.addEventListener("click", () => {
    adminPanel.hidden = true;
    adminPanel.style.display = "none";
  });
}

if (adminPanel) {
  adminPanel.addEventListener("click", (event) => {
    if (event.target === adminPanel) {
      adminPanel.hidden = true;
    adminPanel.style.display = "none";
    }
  });
}

const SUPABASE_URL = "https://efrkjqbrfsynzdjbgqck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP";
// Used for client-side gating only. The real enforcement must be Supabase RLS.
const ADMIN_EMAIL = "kevinmarmstrong1990@gmail.com";
const OPML_URL =
  "https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/hn-popular-blogs-2025.opml";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const CORS_PROXY_JSON = "https://api.allorigins.win/get?url=";
const RSS_FEED_LIMIT = 36;

const FALLBACK_FEEDS = [
  { title: "simonwillison.net", url: "https://simonwillison.net/atom/everything/" },
  { title: "jeffgeerling.com", url: "https://www.jeffgeerling.com/blog.xml" },
  { title: "daringfireball.net", url: "https://daringfireball.net/feeds/main" },
  { title: "overreacted.io", url: "https://overreacted.io/rss.xml" },
  { title: "krebsonsecurity.com", url: "https://krebsonsecurity.com/feed/" },
  { title: "mitchellh.com", url: "https://mitchellh.com/feed.xml" },
  { title: "pluralistic.net", url: "https://pluralistic.net/feed/" },
  { title: "devblogs.microsoft.com/oldnewthing", url: "https://devblogs.microsoft.com/oldnewthing/feed" }
];

const ABOUT_DATA = {
  origin: {
    title: "Origin",
    body:
      "Electrical engineer turned iOS developer and product leader. I build systems that feel simple to customers and scale cleanly for teams.",
  },
  craft: {
    title: "Craft",
    body:
      "I design for clarity, test for lift, and ship with reliable analytics. My favorite work lives at the intersection of UX, payments, and retention.",
  },
  impact: {
    title: "Impact",
    body:
      "From $13.2MM annual GMS at Amazon to 3MM Walgreens wallet users, I focus on measurable outcomes and durable product foundations.",
  },
  now: {
    title: "Now",
    body:
      "Leading Prime payments and expansion strategies, while exploring AI workflows that accelerate launch readiness and documentation.",
  },
};

const TIMELINE_DATA = [
  {
    year: "2026–Now",
    text:
      "Working to bring Starlink to businesses around the globe.",
  },
  {
    year: "2021–2026",
    text:
     "Amazon: Led payment optimization strategy (0.5MM Prime members, $13.2MM annual GMS), added bank-to-bank payments in Spain, and drove Prime expansion across 13 markets.",
  },
  {
    year: "2018–2021",
    text:
      "Walgreens: Built iOS + desktop wallet for 3MM users, ran CX optimization sprints, and delivered Rx locker innovations generating $3.5MM GMS.",
   },
  {
    year: "2013–2018",
    text:
      "Capital One: Launched Apply & Buy for 1MM customers, shipped omnichannel credit card app, and built iOS wallet features that reduced call volume.",
  },
];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

function setupAbout() {
  const tabs = document.getElementById("about-tabs");
  const title = document.getElementById("about-title");
  const body = document.getElementById("about-body");

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    tabs.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
    button.classList.add("active");

    const key = button.dataset.about;
    title.textContent = ABOUT_DATA[key].title;
    body.textContent = ABOUT_DATA[key].body;
  });
}

function setupTimeline() {
  const timeline = document.getElementById("timeline");
  const detail = document.getElementById("timeline-detail");

  timeline.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    timeline.querySelectorAll(".timeline-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const index = Number(button.dataset.timeline || 0);
    detail.textContent = TIMELINE_DATA[index]?.text || "";
  });
}

function setupPortfolio() {
  const tabs = document.getElementById("portfolio-tabs");
  const filters = document.getElementById("portfolio-filters");
  const projectsView = document.getElementById("portfolio-projects");
  const workView = document.getElementById("portfolio-work");
  const projectsGrid = document.getElementById("projects-grid");
  const workGrid = document.getElementById("work-grid");

  if (!filters || !projectsView || !workView || !projectsGrid || !workGrid) return;

  let activeView = "projects";
  let activeFilter = "all";

  function getActiveCards() {
    const grid = activeView === "projects" ? projectsGrid : workGrid;
    return Array.from(grid.querySelectorAll(".project-card"));
  }

  function applyFilter(filter) {
    activeFilter = filter;
    const cards = getActiveCards();
    cards.forEach((card) => {
      if (filter === "all" || String(card.dataset.tags || "").includes(filter)) {
        card.style.display = "grid";
      } else {
        card.style.display = "none";
      }
    });
  }

  function setView(nextView) {
    activeView = nextView;
    projectsView.hidden = nextView !== "projects";
    workView.hidden = nextView !== "work";

    // Reset filter pills to "All" on view switch so the new grid doesn't appear empty.
    filters.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
    const allPill = filters.querySelector("[data-filter='all']");
    if (allPill) allPill.classList.add("active");
    applyFilter("all");
  }

  if (tabs) {
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const view = button.dataset.view;
      if (view !== "projects" && view !== "work") return;

      tabs.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
      button.classList.add("active");
      setView(view);
    });
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    filters.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    applyFilter(filter);
  });

  document.querySelectorAll("[data-expand]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.expand;
      const detail = document.querySelector(`[data-detail='${id}']`);
      if (!detail) return;
      detail.classList.toggle("open");
      button.textContent = detail.classList.contains("open") ? "Close" : "Read the story";
    });
  });

  // Ensure the default view is Projects.
  setView("projects");
}

function supabaseReady() {
  return !SUPABASE_URL.startsWith("__") && !SUPABASE_ANON_KEY.startsWith("__");
}

function setFormEnabled(form, enabled) {
  form.querySelectorAll("input, textarea, button").forEach((el) => {
    el.disabled = !enabled;
  });
}

function wrapTextareaSelection(textarea, before, after) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value ?? "";
  const selected = value.slice(start, end) || "";
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

function applySpanStyle(textarea, style) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value ?? "";
  const selected = value.slice(start, end) || "";
  const before = `<span style="${style}">`;
  const after = `</span>`;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

function setupComposeToolbar(form) {
  const textarea = form?.querySelector("textarea[name='content']");
  const toolbar = document.getElementById("blog-compose-toolbar");
  if (!(textarea instanceof HTMLTextAreaElement)) return;
  if (!toolbar) return;

  toolbar.querySelectorAll("button[data-compose-action]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener("click", () => {
      const action = button.dataset.composeAction;
      if (action === "bold") wrapTextareaSelection(textarea, "<strong>", "</strong>");
      if (action === "italic") wrapTextareaSelection(textarea, "<em>", "</em>");
      if (action === "underline") wrapTextareaSelection(textarea, "<u>", "</u>");
    });
  });

  toolbar.querySelectorAll("select[data-compose-action]").forEach((select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    select.addEventListener("change", () => {
      const action = select.dataset.composeAction;
      const value = select.value;
      if (!value) return;
      if (action === "size") applySpanStyle(textarea, `font-size:${value}`);
      if (action === "family") applySpanStyle(textarea, `font-family:${value}`);
      select.value = "";
    });
  });

  toolbar.querySelectorAll("input[type='color'][data-compose-action]").forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.addEventListener("change", () => {
      const value = input.value;
      if (!value) return;
      applySpanStyle(textarea, `color:${value}`);
    });
  });
}

async function setupBlog() {
  const status = document.getElementById("blog-status");
  const configStatus = document.getElementById("blog-config");
  const list = document.getElementById("blog-list");
  const publishPanel = document.getElementById("publish-panel");
  const form = document.getElementById("blog-form");
  const authForm = document.getElementById("auth-form");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const authStatus = document.getElementById("auth-status");
  const authLogout = document.getElementById("auth-logout");
  let currentSession = null;

  if (!supabaseReady()) {
    status.textContent = "Waiting for Supabase config";
    configStatus.textContent = "Update SUPABASE_URL and SUPABASE_ANON_KEY in main.js";
    setFormEnabled(form, false);
    setFormEnabled(authForm, false);
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setupComposeToolbar(form);
  configStatus.textContent = "Supabase connected";
  setFormEnabled(form, false);
  if (publishPanel) publishPanel.style.display = "none";
  authLogout.style.display = "none";

  function setAuthState(session) {
    currentSession = session;
    if (session?.user) {
      authStatus.textContent = `Signed in as ${session.user.email}`;
      authLogout.style.display = "inline-flex";
      setFormEnabled(form, true);
      if (publishPanel) publishPanel.style.display = "grid";
    } else {
      authStatus.textContent = "Not signed in";
      authLogout.style.display = "none";
      setFormEnabled(form, false);
      if (publishPanel) publishPanel.style.display = "none";
    }
  }

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    setAuthState(data.session);
  }

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) return;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      authStatus.textContent = `Sign-in failed: ${error.message}`;
      return;
    }
    setAuthState(data.session);
  });

  authLogout.addEventListener("click", async () => {
    await supabase.auth.signOut();
    await refreshSession();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setAuthState(session);
  });

  function canEdit() {
    const email = currentSession?.user?.email || "";
    return Boolean(email) && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  async function updatePost(id, patch) {
    if (!canEdit()) {
      status.textContent = "Sign in to edit posts";
      return { ok: false, error: new Error("Not authorized") };
    }

    // Force PostgREST to return something so we can detect "no rows updated".
    const { data, error } = await supabase.from("posts").update(patch).eq("id", id).select("id");
    if (error) {
      status.textContent = `Edit failed: ${error.message}`;
      return { ok: false, error };
    }
    if (!Array.isArray(data) || data.length === 0) {
      const err = new Error("No rows updated (RLS policy may be blocking updates).");
      status.textContent = `Edit failed: ${err.message}`;
      return { ok: false, error: err };
    }
    status.textContent = "Saved";
    return { ok: true, error: null };
  }

  async function loadPosts() {
    status.textContent = "Loading posts...";
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,summary,content,tags,published_at")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      status.textContent = "Unable to load posts";
      list.innerHTML = `<div class="blog-post">${error.message}</div>`;
      return;
    }

    if (!data.length) {
      status.textContent = "No posts yet";
      list.innerHTML = `<div class="blog-post">Publish your first post on the right.</div>`;
      return;
    }

    status.textContent = `${data.length} posts`;
    list.innerHTML = data
      .map((post) => {
        const tags = post.tags?.length ? post.tags.join(", ") : "";
        const content = post.content || "";
        const canUserEdit = canEdit();
        return `
          <article class="blog-post">
            <div class="blog-post-header">
              <h4>${post.title}</h4>
              <div class="blog-post-actions">
                <button class="link blog-toggle" data-post="${post.id}">Read</button>
                ${canUserEdit ? `<button class="link blog-edit" data-edit="${post.id}">Edit</button>` : ""}
              </div>
            </div>
            <p>${post.summary}</p>
            <div class="blog-content" data-content="${post.id}">${renderMarkdown(content)}</div>
            <form class="blog-edit-form" data-form="${post.id}" style="display:none;">
              <label>
                Title
                <input type="text" name="title" value="${escapeHtml(post.title || "")}" />
              </label>
              <label>
                Summary
                <input type="text" name="summary" value="${escapeHtml(post.summary || "")}" />
              </label>
              <label>
                Content
                <div class="blog-editor-toolbar" data-toolbar="${post.id}">
                  <button class="btn ghost" type="button" data-md="${post.id}" data-action="bold">B</button>
                  <button class="btn ghost" type="button" data-md="${post.id}" data-action="italic">I</button>
                  <button class="btn ghost" type="button" data-md="${post.id}" data-action="underline">U</button>
                  <input class="blog-editor-color" type="color" data-md="${post.id}" data-action="color" aria-label="Font color" value="#d6deeb" />
                  <select class="blog-editor-select" data-md="${post.id}" data-action="size" aria-label="Font size">
                    <option value="">Size</option>
                    <option value="12px">12</option>
                    <option value="14px">14</option>
                    <option value="16px">16</option>
                    <option value="18px">18</option>
                    <option value="22px">22</option>
                    <option value="26px">26</option>
                  </select>
                  <select class="blog-editor-select" data-md="${post.id}" data-action="family" aria-label="Font family">
                    <option value="">Font</option>
                    <option value="D-DIN">D-DIN</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <textarea name="content" rows="8">${escapeHtml(post.content || "")}</textarea>
              </label>
              <label>
                Tags (comma-separated)
                <input type="text" name="tags" value="${escapeHtml(tags)}" />
              </label>
              <div class="blog-edit-actions">
                <button class="btn ghost" data-cancel="${post.id}" type="button">Cancel</button>
                <button class="btn primary" type="submit">Save</button>
              </div>
              <p class="helper" data-edit-status="${post.id}"></p>
            </form>
            <small>${new Date(post.published_at).toLocaleString()}${tags ? ` • ${tags}` : ""}</small>
          </article>
        `;
      })
      .join("");

    window.setupBlogPostToggles(list);

    list.querySelectorAll(".blog-edit").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.edit;
        const formEl = list.querySelector(`[data-form='${id}']`);
        const contentEl = list.querySelector(`[data-content='${id}']`);
        if (!formEl) return;
        if (contentEl) contentEl.classList.remove("open");
        formEl.style.display = "grid";
      });
    });

    list.querySelectorAll("[data-cancel]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.cancel;
        const formEl = list.querySelector(`[data-form='${id}']`);
        if (!formEl) return;
        formEl.style.display = "none";
      });
    });

    list.querySelectorAll(".blog-edit-form").forEach((editForm) => {
      editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = editForm.dataset.form;
        const localStatus = list.querySelector(`[data-edit-status='${id}']`);
        if (localStatus) localStatus.textContent = "Saving...";
        const submit = editForm.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        const formData = new FormData(editForm);
        const tags = String(formData.get("tags") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const result = await updatePost(id, {
          title: formData.get("title"),
          summary: formData.get("summary"),
          content: formData.get("content"),
          tags,
        });

        if (submit) submit.disabled = false;
        if (result.ok) {
          if (localStatus) localStatus.textContent = "";
          editForm.style.display = "none";
          await loadPosts();
        } else {
          if (localStatus) localStatus.textContent = `Save failed: ${result.error?.message || "Unknown error"}`;
        }
      });
    });

    // Rich formatting toolbar actions for the edit textarea.
    list.querySelectorAll("[data-md][data-action]").forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      button.addEventListener("click", () => {
        const id = button.dataset.md;
        const action = button.dataset.action;
        const formEl = list.querySelector(`[data-form='${id}']`);
        const textarea = formEl?.querySelector("textarea[name='content']");
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        if (action === "bold") wrapTextareaSelection(textarea, "<strong>", "</strong>");
        if (action === "italic") wrapTextareaSelection(textarea, "<em>", "</em>");
        if (action === "underline") wrapTextareaSelection(textarea, "<u>", "</u>");
      });
    });

    list.querySelectorAll("select[data-md][data-action]").forEach((select) => {
      if (!(select instanceof HTMLSelectElement)) return;
      select.addEventListener("change", () => {
        const id = select.dataset.md;
        const action = select.dataset.action;
        const value = select.value;
        const formEl = list.querySelector(`[data-form='${id}']`);
        const textarea = formEl?.querySelector("textarea[name='content']");
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        if (!value) return;

        if (action === "size") applySpanStyle(textarea, `font-size:${value}`);
        if (action === "family") applySpanStyle(textarea, `font-family:${value}`);
        select.value = "";
      });
    });

    list.querySelectorAll("input[type='color'][data-md][data-action]").forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      input.addEventListener("change", () => {
        const id = input.dataset.md;
        const action = input.dataset.action;
        const value = input.value;
        const formEl = list.querySelector(`[data-form='${id}']`);
        const textarea = formEl?.querySelector("textarea[name='content']");
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        if (!value) return;
        if (action === "color") applySpanStyle(textarea, `color:${value}`);
      });
    });
  }

  await loadPosts();
  await refreshSession();

  supabase
    .channel("posts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posts" },
      () => loadPosts()
    )
    .subscribe();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title"),
      summary: formData.get("summary"),
      content: formData.get("content"),
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("posts").insert(payload);

    if (error) {
      status.textContent = `Publish failed: ${error.message}`;
      return;
    }

    form.reset();
    status.textContent = "Published";
  });
}




function renderMarkdown(content) {
  if (!content) return "";
  if (window.marked && window.DOMPurify) {
    // Allow a very small subset of inline HTML for formatting controls.
    if (!window.__purifyConfigured) {
      window.DOMPurify.setConfig({
        ALLOWED_TAGS: [
          "a",
          "b",
          "blockquote",
          "br",
          "code",
          "em",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "i",
          "li",
          "ol",
          "p",
          "pre",
          "span",
          "strong",
          "u",
          "ul",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "style"],
      });

      window.DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
        if (data.attrName !== "style") return;

        const raw = String(data.attrValue || "");
        const declarations = raw
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean);

        const allowedFamilies = new Set([
          "D-DIN",
          "JetBrains Mono",
          "SFMono-Regular",
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ]);

        const out = [];
        for (const decl of declarations) {
          const [propRaw, ...valueParts] = decl.split(":");
          const prop = (propRaw || "").trim().toLowerCase();
          const value = valueParts.join(":").trim();
          if (!prop || !value) continue;

          if (prop === "color") {
            const m = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
            if (!m) continue;
            out.push(`color:${value.toLowerCase()}`);
            continue;
          }

          if (prop === "font-size") {
            const m = value.match(/^([0-9]{1,2})(px)$/);
            if (!m) continue;
            const px = Number(m[1]);
            if (px < 10 || px > 32) continue;
            out.push(`font-size:${px}px`);
            continue;
          }

          if (prop === "font-family") {
            const families = value
              .split(",")
              .map((f) => f.trim().replaceAll('"', "").replaceAll("'", ""))
              .filter(Boolean);
            const safe = families.filter((f) => allowedFamilies.has(f));
            if (!safe.length) continue;
            out.push(`font-family:${safe.map((f) => `"${f}"`).join(",")}`);
            continue;
          }

          if (prop === "text-decoration") {
            if (value !== "underline") continue;
            out.push("text-decoration:underline");
            continue;
          }
        }

        data.attrValue = out.join(";");
      });

      window.__purifyConfigured = true;
    }

    const html = window.marked.parse(content, { breaks: true });
    return window.DOMPurify.sanitize(html);
  }
  return content;
}

function stripHtml(input) {
  const div = document.createElement("div");
  div.innerHTML = input || "";
  return div.textContent || div.innerText || "";
}

function clampText(text, max = 120) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}


function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function getJinaUrl(targetUrl) {
  const normalized = targetUrl.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${normalized}`;
}

async function fetchTextWithFallbacks(targetUrl) {
  const attempts = [
    { label: "direct", url: targetUrl, type: "text" },
    { label: "allorigins-raw", url: `${CORS_PROXY}${encodeURIComponent(targetUrl)}`, type: "text" },
    { label: "allorigins-json", url: `${CORS_PROXY_JSON}${encodeURIComponent(targetUrl)}`, type: "json" },
    { label: "jina", url: getJinaUrl(targetUrl), type: "text" },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      const response = await fetchWithTimeout(attempt.url, {}, 12000);
      if (!response.ok) {
        lastError = new Error(`${attempt.label}: ${response.status}`);
        continue;
      }
      if (attempt.type === "json") {
        const payload = await response.json();
        if (!payload.contents) {
          lastError = new Error(`${attempt.label}: empty response`);
          continue;
        }
        return payload.contents;
      }
      return await response.text();
    } catch (error) {
      lastError = new Error(`${attempt.label}: ${error.message}`);
    }
  }
  throw lastError || new Error("Load failed");
}
async function fetchOPMLFeeds() {
  const text = await fetchTextWithFallbacks(OPML_URL);
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const outlines = Array.from(xml.querySelectorAll("outline[xmlUrl]"));
  return outlines.map((node) => ({
    title: node.getAttribute("title") || node.getAttribute("text") || "Feed",
    url: node.getAttribute("xmlUrl"),
  }));
}

async function fetchFeed(feed) {
  const text = await fetchTextWithFallbacks(feed.url);
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");

  const items = Array.from(xml.querySelectorAll("item"));
  if (items.length) {
    return items.slice(0, 5).map((item) => ({
      title: item.querySelector("title")?.textContent || "Untitled",
      link: item.querySelector("link")?.textContent || "",
      date: item.querySelector("pubDate")?.textContent || "",
      summary:
        item.querySelector("description")?.textContent ||
        item.querySelector("content:encoded")?.textContent ||
        "",
      source: feed.title,
    }));
  }

  const entries = Array.from(xml.querySelectorAll("entry"));
  return entries.slice(0, 5).map((entry) => ({
    title: entry.querySelector("title")?.textContent || "Untitled",
    link: entry.querySelector("link")?.getAttribute("href") || "",
    date: entry.querySelector("updated")?.textContent || "",
    summary:
      entry.querySelector("summary")?.textContent ||
      entry.querySelector("content")?.textContent ||
      "",
    source: feed.title,
  }));
}




function loadSeedRss() {
  const seedEl = document.getElementById("rss-seed");
  if (!seedEl) return null;
  try {
    const data = JSON.parse(seedEl.textContent || "[]");
    if (!Array.isArray(data) || !data.length) return null;
    return data;
  } catch (error) {
    return null;
  }
}

function loadCachedRss() {
  try {
    const raw = localStorage.getItem("rss-cache");
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || !Array.isArray(payload.items)) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function saveCachedRss(items) {
  try {
    localStorage.setItem("rss-cache", JSON.stringify({
      saved_at: new Date().toISOString(),
      items
    }));
  } catch (error) {
    // ignore
  }
}

async function fetchLocalRss() {
  const cacheBust = `rss.json?ts=${Date.now()}`;
  const response = await fetch(cacheBust);
  if (!response.ok) return null;
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.items)) return null;
  return payload.items;
}


function renderRssTimestamp(target) {
  const stamp = document.getElementById("rss-updated");
  if (!stamp) return;
  if (!target) {
    stamp.textContent = "";
    return;
  }
  const date = new Date(target);
  stamp.textContent = `Last updated ${date.toLocaleString()}`;
}

async function setupRSS() {
  const status = document.getElementById("rss-status");
  const list = document.getElementById("rss-list");
  const search = document.getElementById("rss-search");
  const refresh = document.getElementById("rss-refresh");

  let items = [];

  async function loadFeeds() {
    status.textContent = "Loading feeds...";
    list.innerHTML = "";
    try {
      const seedItems = loadSeedRss();
      if (seedItems && seedItems.length) {
        items = seedItems
          .map((item) => ({
            ...item,
            dateValue: item.date ? new Date(item.date).getTime() : 0,
          }))
          .sort((a, b) => b.dateValue - a.dateValue)
          .slice(0, 40);
        status.textContent = `Showing ${items.length} latest items (seeded)`;
        renderList(items);
        renderRssTimestamp(new Date().toISOString());
      }

      const cachedPayload = loadCachedRss();
      if (cachedPayload && cachedPayload.items && cachedPayload.items.length) {
        items = cachedPayload.items
          .map((item) => ({
            ...item,
            dateValue: item.date ? new Date(item.date).getTime() : 0,
          }))
          .sort((a, b) => b.dateValue - a.dateValue)
          .slice(0, 40);
        status.textContent = `Showing ${items.length} latest items (cached)`;
        renderList(items);
        renderRssTimestamp(cachedPayload.saved_at);
      }

      const localItems = await fetchLocalRss();
      if (localItems && localItems.length) {
        items = localItems
          .map((item) => ({
            ...item,
            dateValue: item.date ? new Date(item.date).getTime() : 0,
          }))
          .sort((a, b) => b.dateValue - a.dateValue)
          .slice(0, 40);
        status.textContent = `Showing ${items.length} latest items (cached)`;
        renderList(items);
        renderRssTimestamp(new Date().toISOString());
        saveCachedRss(items);
        return;
      }

      status.textContent = "Fetching feed list...";
      let feeds = [];
      try {
        feeds = (await fetchOPMLFeeds()).slice(0, RSS_FEED_LIMIT);
      } catch (error) {
        feeds = FALLBACK_FEEDS.slice(0, RSS_FEED_LIMIT);
        status.textContent = "Using fallback feeds...";
      }
      if (!feeds.length) {
        feeds = FALLBACK_FEEDS.slice(0, RSS_FEED_LIMIT);
      }

      const batches = [];
      const concurrency = 6;

      for (let i = 0; i < feeds.length; i += concurrency) {
        batches.push(feeds.slice(i, i + concurrency));
      }

      const results = [];
      let completed = 0;
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(batch.map(fetchFeed));
        batchResults.forEach((result) => {
          completed += 1;
          if (result.status === "fulfilled") {
            results.push(...result.value);
          }
        });
        status.textContent = `Fetching feeds... ${completed}/${feeds.length}`;
      }

      items = results
        .filter((item) => item.link)
        .map((item) => ({
          ...item,
          dateValue: item.date ? new Date(item.date).getTime() : 0,
        }))
        .sort((a, b) => b.dateValue - a.dateValue)
        .slice(0, 40);

      if (!items.length) {
        status.textContent = `No items loaded (0/${feeds.length} feeds). Try refresh.`;
        list.innerHTML = "";
        return;
      }

      status.textContent = `Showing ${items.length} latest items from ${feeds.length} feeds`;
      renderList(items);
    } catch (error) {
      status.textContent = `RSS load failed: ${error.message}`;
    }
  }

  function renderList(listItems) {
    list.innerHTML = listItems
      .map(
        (item) => `
        <article class="rss-item">
          <a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a>
          <p class="rss-summary">${clampText(stripHtml(item.summary)) || "No summary available."}</p>
          <small>${item.source}${item.date ? ` • ${new Date(item.date).toLocaleDateString()}` : ""}</small>
        </article>
      `
      )
      .join("");
    window.setupBlogPostToggles(list);
  }

  search.addEventListener("input", () => {
    const query = search.value.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query)
    );
    renderList(filtered);
  });

  refresh.addEventListener("click", () => loadFeeds());

  await loadFeeds();
}

setupAbout();
setupTimeline();
setupPortfolio();
setupBlog();
setupRSS();
