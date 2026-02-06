const SUPABASE_URL = "https://efrkjqbrfsynzdjbgqck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP";
const OPML_URL =
  "https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/hn-popular-blogs-2025.opml";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

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
    year: "2021–Now",
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
  const filters = document.getElementById("portfolio-filters");
  const cards = Array.from(document.querySelectorAll(".project-card"));

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    filters.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    cards.forEach((card) => {
      if (filter === "all" || card.dataset.tags.includes(filter)) {
        card.style.display = "grid";
      } else {
        card.style.display = "none";
      }
    });
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
}

function supabaseReady() {
  return !SUPABASE_URL.startsWith("__") && !SUPABASE_ANON_KEY.startsWith("__");
}

function setFormEnabled(form, enabled) {
  form.querySelectorAll("input, textarea, button").forEach((el) => {
    el.disabled = !enabled;
  });
}

async function setupBlog() {
  const status = document.getElementById("blog-status");
  const configStatus = document.getElementById("blog-config");
  const list = document.getElementById("blog-list");
  const form = document.getElementById("blog-form");
  const authForm = document.getElementById("auth-form");
  const authEmail = document.getElementById("auth-email");
  const authPassword = document.getElementById("auth-password");
  const authStatus = document.getElementById("auth-status");
  const authLogout = document.getElementById("auth-logout");

  if (!supabaseReady()) {
    status.textContent = "Waiting for Supabase config";
    configStatus.textContent = "Update SUPABASE_URL and SUPABASE_ANON_KEY in main.js";
    setFormEnabled(form, false);
    setFormEnabled(authForm, false);
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  configStatus.textContent = "Supabase connected";
  setFormEnabled(form, false);
  authLogout.style.display = "none";

  function setAuthState(session) {
    if (session?.user) {
      authStatus.textContent = `Signed in as ${session.user.email}`;
      authLogout.style.display = "inline-flex";
      setFormEnabled(form, true);
    } else {
      authStatus.textContent = "Not signed in";
      authLogout.style.display = "none";
      setFormEnabled(form, false);
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
        return `
          <article class="blog-post">
            <h4>${post.title}</h4>
            <p>${post.summary}</p>
            <small>${new Date(post.published_at).toLocaleString()}${tags ? ` • ${tags}` : ""}</small>
          </article>
        `;
      })
      .join("");
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

async function fetchOPMLFeeds() {
  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(OPML_URL)}`);
  if (!response.ok) {
    throw new Error("Unable to load OPML list");
  }
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const outlines = Array.from(xml.querySelectorAll("outline[xmlUrl]"));
  return outlines.map((node) => ({
    title: node.getAttribute("title") || node.getAttribute("text") || "Feed",
    url: node.getAttribute("xmlUrl"),
  }));
}

async function fetchFeed(feed) {
  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feed.url)}`);
  if (!response.ok) throw new Error("Feed unavailable");
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");

  const items = Array.from(xml.querySelectorAll("item"));
  if (items.length) {
    return items.slice(0, 5).map((item) => ({
      title: item.querySelector("title")?.textContent || "Untitled",
      link: item.querySelector("link")?.textContent || "",
      date: item.querySelector("pubDate")?.textContent || "",
      source: feed.title,
    }));
  }

  const entries = Array.from(xml.querySelectorAll("entry"));
  return entries.slice(0, 5).map((entry) => ({
    title: entry.querySelector("title")?.textContent || "Untitled",
    link: entry.querySelector("link")?.getAttribute("href") || "",
    date: entry.querySelector("updated")?.textContent || "",
    source: feed.title,
  }));
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
      const feeds = await fetchOPMLFeeds();
      const batches = [];
      const concurrency = 6;

      for (let i = 0; i < feeds.length; i += concurrency) {
        batches.push(feeds.slice(i, i + concurrency));
      }

      const results = [];
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(batch.map(fetchFeed));
        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results.push(...result.value);
          }
        });
      }

      items = results
        .filter((item) => item.link)
        .map((item) => ({
          ...item,
          dateValue: item.date ? new Date(item.date).getTime() : 0,
        }))
        .sort((a, b) => b.dateValue - a.dateValue)
        .slice(0, 40);

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
          <small>${item.source}${item.date ? ` • ${new Date(item.date).toLocaleDateString()}` : ""}</small>
        </article>
      `
      )
      .join("");
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
