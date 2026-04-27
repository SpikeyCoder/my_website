function loadScript(e){return new Promise((t,n)=>{if(document.querySelector(`script[src="${e}"]`))return void t();const o=document.createElement("script");o.src=e,o.onload=t,o.onerror=n,document.head.appendChild(o)})}async function loadBlogDeps(){await Promise.all([loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"),loadScript("https://cdn.jsdelivr.net/npm/dompurify@3.0.11/dist/purify.min.js"),loadScript("https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js")])}function escapeHtml(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}document.body.classList.add("js"),window.setupBlogPostToggles=function(e){e&&e.querySelectorAll(".blog-toggle").forEach(t=>{t.addEventListener("click",()=>{const n=t.dataset.post,o=e.querySelector(`[data-content='${n}']`);o&&(o.classList.toggle("open"),t.textContent=o.classList.contains("open")?"Close":"Read")})})};const adminToggle=document.getElementById("admin-toggle"),adminPanel=document.getElementById("admin-panel"),adminClose=document.getElementById("admin-close");adminToggle&&adminPanel&&adminToggle.addEventListener("click",()=>{adminPanel.hidden=!1,adminPanel.style.display="grid"}),adminClose&&adminPanel&&adminClose.addEventListener("click",()=>{adminPanel.hidden=!0,adminPanel.style.display="none"}),adminPanel&&adminPanel.addEventListener("click",e=>{e.target===adminPanel&&(adminPanel.hidden=!0,adminPanel.style.display="none")});
const SUPABASE_URL="https://efrkjqbrfsynzdjbgqck.supabase.co",SUPABASE_ANON_KEY="sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP",OPML_URL="https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/hn-popular-blogs-2025.opml",CORS_PROXY="https://api.allorigins.win/raw?url=",CORS_PROXY_JSON="https://api.allorigins.win/get?url=",RSS_FEED_LIMIT=36,RSS_VISIBLE_ITEMS=5,SUPABASE_FUNCTIONS_BASE=`${SUPABASE_URL}/functions/v1`,BOOKING_COOKIE_NAME="hasBooked",BOOKING_COOKIE_MAX_AGE=31449600,PAID_STRIPE_LINK="https://buy.stripe.com/14A28j2RQ3YQ4a82d7ao800",PAID_CAL_LINK="https://calendar.app.google/c61akTb1eUgpoBmh7",FREE_CAL_LINK="https://calendar.app.google/MZYoipmNPctrHqmP7";function updateAnchorOffsetFromHeader(){const e=document.querySelector(".site-nav"),t=e?Math.ceil(e.getBoundingClientRect().height):80,n=Math.max(88,t+8);return document.documentElement.style.setProperty("--anchor-offset",`${n}px`),n}function alignHashTargetToViewportTop(){const e=window.location.hash;if(!e)return;let t=null;try{t=document.querySelector(decodeURIComponent(e))}catch(e){return}if(!t)return;const n=updateAnchorOffsetFromHeader(),o=t.getBoundingClientRect().top+window.scrollY-n;window.scrollTo({top:Math.max(0,o),behavior:"auto"})}function scheduleHashAlignment(){window.location.hash&&(requestAnimationFrame(alignHashTargetToViewportTop),setTimeout(alignHashTargetToViewportTop,250),setTimeout(alignHashTargetToViewportTop,900))}window.addEventListener("resize",updateAnchorOffsetFromHeader),window.addEventListener("orientationchange",()=>{setTimeout(()=>{updateAnchorOffsetFromHeader(),scheduleHashAlignment()},50)}),function updatePageTitle(){const e=window.location.hash.replace(/^#/,"").split("?")[0].split("/")[0]||"",t={"":"Kevin Armstrong — Product Leader & iOS Developer",about:"Kevin Armstrong — About",portfolio:"Kevin Armstrong — Projects",blog:"Kevin Armstrong — Blog","career-acceleration":"Kevin Armstrong — PM Coaching",rss:"Kevin Armstrong — Reading",contact:"Kevin Armstrong — Contact"};document.title=t[e]||"Kevin Armstrong — Product Leader & iOS Developer"}window.addEventListener("hashchange",()=>{updateAnchorOffsetFromHeader(),scheduleHashAlignment(),updatePageTitle()}),window.addEventListener("load",()=>{updateAnchorOffsetFromHeader(),scheduleHashAlignment(),updatePageTitle()});const FALLBACK_FEEDS=[{title:"simonwillison.net",url:"https://simonwillison.net/atom/everything/"},{title:"jeffgeerling.com",url:"https://www.jeffgeerling.com/blog.xml"},{title:"daringfireball.net",url:"https://daringfireball.net/feeds/main"},{title:"overreacted.io",url:"https://overreacted.io/rss.xml"},{title:"krebsonsecurity.com",url:"https://krebsonsecurity.com/feed/"},{title:"mitchellh.com",url:"https://mitchellh.com/feed.xml"},{title:"pluralistic.net",url:"https://pluralistic.net/feed/"},{title:"devblogs.microsoft.com/oldnewthing",url:"https://devblogs.microsoft.com/oldnewthing/feed"}],ABOUT_DATA={origin:{title:"Origin",body:"Electrical engineer turned iOS developer and product leader. I build systems that feel simple to customers and scale cleanly for teams."},craft:{title:"Craft",body:"I design for clarity, test for lift, and ship with reliable analytics. My favorite work lives at the intersection of UX, payments, and retention."},impact:{title:"Impact",body:"From $13.2MM annual GMS at Amazon to 3MM Walgreens wallet users, I focus on measurable outcomes and durable product foundations."},now:{title:"Now",body:"Expanding Armstrong HoldCo LLC to focus on career development and empowering non-profits to go farther with AI. Led eCommerce development for Starlink. Focused on expansion strategies, while exploring AI workflows that accelerate launch readiness and documentation."}},TIMELINE_DATA=[{year:"2026-Present",text:"focused on career development services and empowering non-profits to go farther with AI."},{year:"2026–2026",text:"Brought Starlink to businesses around the globe."},{year:"2021–2026",text:"Amazon: Led payment optimization strategy (0.5MM Prime members, $13.2MM annual GMS), added bank-to-bank payments in Spain, and drove Prime expansion across 13 markets."},{year:"2018–2021",text:"Walgreens: Built iOS + desktop wallet for 3MM users, ran CX optimization sprints, and delivered Rx locker innovations generating $3.5MM GMS."},{year:"2013–2018",text:"Capital One: Launched Apply & Buy for 1MM customers, shipped omnichannel credit card app, and built iOS wallet features that reduced call volume."}],revealObserver=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("visible"),revealObserver.unobserve(e.target))})},{threshold:.2});function setupAbout(){const e=document.getElementById("about-tabs"),t=document.getElementById("about-title"),n=document.getElementById("about-body");e.addEventListener("click",o=>{const a=o.target.closest("button");if(!a)return;e.querySelectorAll(".pill").forEach(e=>e.classList.remove("active")),a.classList.add("active");const r=a.dataset.about;t.textContent=ABOUT_DATA[r].title,n.textContent=ABOUT_DATA[r].body})}function setupTimeline(){const e=document.getElementById("timeline"),t=document.getElementById("timeline-detail");e.addEventListener("click",n=>{const o=n.target.closest("button");if(!o)return;e.querySelectorAll(".timeline-item").forEach(e=>e.classList.remove("active")),o.classList.add("active");const a=Number(o.dataset.timeline||0);t.textContent=TIMELINE_DATA[a]?.text||""})}function setupPortfolio(){const e=document.getElementById("portfolio-tabs"),t=document.getElementById("portfolio-projects"),n=document.getElementById("portfolio-work"),o=document.getElementById("projects-grid"),a=document.getElementById("work-grid");if(!(t&&n&&o&&a))return;let r="projects";function i(e){r=e,t.hidden="projects"!==e,n.hidden="work"!==e}e&&e.addEventListener("click",t=>{const n=t.target.closest("button");if(!n)return;const o=n.dataset.view;"projects"!==o&&"work"!==o||(e.querySelectorAll(".pill").forEach(e=>e.classList.remove("active")),n.classList.add("active"),i(o))}),document.querySelectorAll("[data-expand]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.expand,n=document.querySelector(`[data-detail='${t}']`);n&&(n.classList.toggle("open"),e.textContent=n.classList.contains("open")?"Close":"Read the story")})}),i("projects")}function supabaseReady(){return!SUPABASE_URL.startsWith("__")&&!SUPABASE_ANON_KEY.startsWith("__")}function setFormEnabled(e,t){e.querySelectorAll("input, textarea, button").forEach(e=>{e.disabled=!t})}function wrapTextareaSelection(e,t,n){const o=e.selectionStart??0,a=e.selectionEnd??0,r=e.value??"",i=r.slice(o,a)||"",l=r.slice(0,o)+t+i+n+r.slice(a);e.value=l;const s=o+t.length+i.length;e.focus(),e.setSelectionRange(s,s)}function applySpanStyle(e,t){const n=e.selectionStart??0,o=e.selectionEnd??0,a=e.value??"",r=a.slice(n,o)||"",i=`<span style="${t}">`,l="</span>",s=a.slice(0,n)+i+r+l+a.slice(o);e.value=s;const c=n+i.length+r.length+7;e.focus(),e.setSelectionRange(c,c)}function setupComposeToolbar(e){const t=e?.querySelector("textarea[name='content']"),n=document.getElementById("blog-compose-toolbar");t instanceof HTMLTextAreaElement&&n&&(n.querySelectorAll("button[data-compose-action]").forEach(e=>{e instanceof HTMLButtonElement&&e.addEventListener("click",()=>{const n=e.dataset.composeAction;"bold"===n&&wrapTextareaSelection(t,"<strong>","</strong>"),"italic"===n&&wrapTextareaSelection(t,"<em>","</em>"),"underline"===n&&wrapTextareaSelection(t,"<u>","</u>")})}),n.querySelectorAll("select[data-compose-action]").forEach(e=>{e instanceof HTMLSelectElement&&e.addEventListener("change",()=>{const n=e.dataset.composeAction,o=e.value;o&&("size"===n&&applySpanStyle(t,`font-size:${o}`),"family"===n&&applySpanStyle(t,`font-family:${o}`),e.value="")})}),n.querySelectorAll("input[type='color'][data-compose-action]").forEach(e=>{e instanceof HTMLInputElement&&e.addEventListener("change",()=>{const n=e.value;n&&applySpanStyle(t,`color:${n}`)})}))}async function setupBlog(){await loadBlogDeps();const e=document.getElementById("blog-status"),t=document.getElementById("blog-config"),n=document.getElementById("blog-list"),o=document.getElementById("publish-panel"),a=document.getElementById("blog-form"),r=document.getElementById("auth-form"),i=document.getElementById("auth-email"),l=document.getElementById("auth-password"),s=document.getElementById("auth-status"),c=document.getElementById("auth-logout");let d=null,u=[];if(!supabaseReady())return e.textContent="Waiting for Supabase config",t.textContent="Update SUPABASE_URL and SUPABASE_ANON_KEY in main.js",setFormEnabled(a,!1),void setFormEnabled(r,!1);const m=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);function p(e){d=e,e?.user?(s.textContent=`Signed in as ${e.user.email}`,c.style.display="inline-flex",setFormEnabled(a,!0),o&&(o.style.display="grid")):(s.textContent="Not signed in",c.style.display="none",setFormEnabled(a,!1),o&&(o.style.display="none"))}async function g(){const{data:e}=await m.auth.getSession();p(e.session)}function f(){return Boolean(d?.user?.email)}function h(){const e=function(){const e=window.location.hash?decodeURIComponent(window.location.hash):"",t=e.match(/^#live-blog\/([^/?#]+)/i);if(t?.[1])return{type:"slug",value:t[1].toLowerCase()};const n=e.match(/^#blog-post-(.+)$/i);return n?.[1]?{type:"id",value:n[1]}:null}();if(!e||!u.length)return;let t=null;if("slug"===e.type?t=u.find(t=>t.shareSlug.toLowerCase()===e.value):"id"===e.type&&(t=u.find(t=>String(t.id)===e.value)),!t)return;const o=n.querySelector(`[data-content='${t.id}']`),a=n.querySelector(`.blog-toggle[data-post='${t.id}']`),r=document.getElementById(`blog-post-${t.id}`);o&&o.classList.add("open"),a&&(a.textContent="Close"),r instanceof HTMLElement&&r.scrollIntoView({block:"start",behavior:"auto"})}async function y(){e.textContent="Loading posts...";const{data:t,error:o}=await m.from("posts").select("id,slug,title,summary,content,tags,published_at").order("published_at",{ascending:!1}).limit(20);return o?(u=[],e.textContent="Unable to load posts",void(n.innerHTML=`<div class="blog-post">${o.message}</div>`)):t.length?(u=buildPostSlugMap(t),e.textContent=`${u.length} posts`,n.innerHTML=u.map(e=>{const t=e.tags?.length?e.tags.join(", "):"",n=e.content||"",o=f(),a=buildBlogPostUrl(e.shareSlug),r=buildShareHref("linkedin",a),i=buildShareHref("x",a);return`\n          <article class="blog-post" id="blog-post-${e.id}">\n            <div class="blog-post-header">\n              <h4>${escapeHtml(e.title)}</h4>\n              <div class="blog-post-actions">\n                <div class="blog-share" data-share-root data-share-url="${escapeHtml(a)}">\n                  <button class="blog-share-trigger" type="button" data-share-trigger aria-haspopup="menu" aria-expanded="false" aria-label="Share post">\n                    ${getShareIcon("share")}\n                  </button>\n                  <div class="share-menu" data-share-menu role="menu" aria-label="Share Post" hidden>\n                    <div class="share-menu-header">\n                      <h5 class="share-menu-title">Share Post</h5>\n                      <button class="share-close" type="button" data-share-close aria-label="Close share menu">×</button>\n                    </div>\n                    <div class="share-menu-items">\n                      <a class="share-menu-item" role="menuitem" data-share-network="linkedin" href="${r}" target="_blank" rel="noreferrer noopener">\n                        ${getShareIcon("linkedin")}\n                        <span>LinkedIn</span>\n                      </a>\n                      <a class="share-menu-item" role="menuitem" data-share-network="x" href="${i}" target="_blank" rel="noreferrer noopener">\n                        ${getShareIcon("x")}\n                        <span>Twitter / X</span>\n                      </a>\n                      <button class="share-menu-item" role="menuitem" type="button" data-share-copy>\n                        ${getShareIcon("copy")}\n                        <span>Copy Link</span>\n                      </button>\n                    </div>\n                  </div>\n                  <span class="copy-feedback" data-copy-feedback aria-live="polite"></span>\n                </div>\n                <button class="link blog-toggle" data-post="${e.id}">Read</button>\n                ${o?`<button class="link blog-edit" data-edit="${e.id}">Edit</button>`:""}\n              </div>\n            </div>\n            <p>${escapeHtml(e.summary)}</p>\n            <div class="blog-content" data-content="${e.id}">${renderMarkdown(n)}</div>\n            <form class="blog-edit-form" data-form="${e.id}" style="display:none;">\n              <label>\n                Title\n                <input type="text" name="title" value="${escapeHtml(e.title||"")}" aria-label="Post title" />\n              </label>\n              <label>\n                Summary\n                <input type="text" name="summary" value="${escapeHtml(e.summary||"")}" aria-label="Post summary" />\n              </label>\n              <label>\n                Content\n                <div class="blog-editor-toolbar" data-toolbar="${e.id}">\n                  <button class="btn ghost" type="button" data-md="${e.id}" data-action="bold">B</button>\n                  <button class="btn ghost" type="button" data-md="${e.id}" data-action="italic">I</button>\n                  <button class="btn ghost" type="button" data-md="${e.id}" data-action="underline">U</button>\n                  <input class="blog-editor-color" type="color" data-md="${e.id}" data-action="color" aria-label="Font color" value="#d6deeb" />\n                  <select class="blog-editor-select" data-md="${e.id}" data-action="size" aria-label="Font size">\n                    <option value="">Size</option>\n                    <option value="12px">12</option>\n                    <option value="14px">14</option>\n                    <option value="16px">16</option>\n                    <option value="18px">18</option>\n                    <option value="22px">22</option>\n                    <option value="26px">26</option>\n                  </select>\n                  <select class="blog-editor-select" data-md="${e.id}" data-action="family" aria-label="Font family">\n                    <option value="">Font</option>\n                    <option value="D-DIN">D-DIN</option>\n                    <option value="JetBrains Mono">JetBrains Mono</option>\n                    <option value="monospace">Monospace</option>\n                  </select>\n                </div>\n                <textarea name="content" rows="8" aria-label="Post content">${escapeHtml(e.content||"")}</textarea>\n              </label>\n              <label>\n                Tags (comma-separated)\n                <input type="text" name="tags" value="${escapeHtml(t)}" aria-label="Post tags" />\n              </label>\n              <div class="blog-edit-actions">\n                <button class="btn ghost" data-cancel="${e.id}" type="button">Cancel</button>\n                <button class="btn primary" type="submit">Save</button>\n              </div>\n              <p class="helper" data-edit-status="${e.id}"></p>\n            </form>\n            <small>${new Date(e.published_at).toLocaleString()} • ${calculateReadingTime(n)} min read${t?` • ${t}`:""}</small>\n          </article>\n        `}).join(""),window.setupBlogPostToggles(n),window.SocialShare?.setupShareMenus&&window.SocialShare.setupShareMenus(n),h(),n.querySelectorAll(".blog-edit").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.edit,o=n.querySelector(`[data-form='${t}']`),a=n.querySelector(`[data-content='${t}']`);o&&(a&&a.classList.remove("open"),o.style.display="grid")})}),n.querySelectorAll("[data-cancel]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.cancel,o=n.querySelector(`[data-form='${t}']`);o&&(o.style.display="none")})}),n.querySelectorAll(".blog-edit-form").forEach(t=>{t.addEventListener("submit",async o=>{o.preventDefault();const a=t.dataset.form,r=n.querySelector(`[data-edit-status='${a}']`);r&&(r.textContent="Saving...");const i=t.querySelector("button[type='submit']");i&&(i.disabled=!0);const l=new FormData(t),s=String(l.get("tags")||"").split(",").map(e=>e.trim()).filter(Boolean),c=await async function(t,n){if(!f())return e.textContent="Sign in to edit posts",{ok:!1,error:new Error("Not authorized")};const{data:o,error:a}=await m.from("posts").update(n).eq("id",t).select("id");if(a)return e.textContent=`Edit failed: ${a.message}`,{ok:!1,error:a};if(!Array.isArray(o)||0===o.length){const t=new Error("No rows updated (RLS policy may be blocking updates).");return e.textContent=`Edit failed: ${t.message}`,{ok:!1,error:t}}return e.textContent="Saved",{ok:!0,error:null}}(a,{title:l.get("title"),summary:l.get("summary"),content:l.get("content"),tags:s});i&&(i.disabled=!1),c.ok?(r&&(r.textContent=""),t.style.display="none",await y()):r&&(r.textContent=`Save failed: ${c.error?.message||"Unknown error"}`)})}),n.querySelectorAll("[data-md][data-action]").forEach(e=>{e instanceof HTMLButtonElement&&e.addEventListener("click",()=>{const t=e.dataset.md,o=e.dataset.action,a=n.querySelector(`[data-form='${t}']`),r=a?.querySelector("textarea[name='content']");r instanceof HTMLTextAreaElement&&("bold"===o&&wrapTextareaSelection(r,"<strong>","</strong>"),"italic"===o&&wrapTextareaSelection(r,"<em>","</em>"),"underline"===o&&wrapTextareaSelection(r,"<u>","</u>"))})}),n.querySelectorAll("select[data-md][data-action]").forEach(e=>{e instanceof HTMLSelectElement&&e.addEventListener("change",()=>{const t=e.dataset.md,o=e.dataset.action,a=e.value,r=n.querySelector(`[data-form='${t}']`),i=r?.querySelector("textarea[name='content']");i instanceof HTMLTextAreaElement&&a&&("size"===o&&applySpanStyle(i,`font-size:${a}`),"family"===o&&applySpanStyle(i,`font-family:${a}`),e.value="")})}),void n.querySelectorAll("input[type='color'][data-md][data-action]").forEach(e=>{e instanceof HTMLInputElement&&e.addEventListener("change",()=>{const t=e.dataset.md,o=e.dataset.action,a=e.value,r=n.querySelector(`[data-form='${t}']`),i=r?.querySelector("textarea[name='content']");i instanceof HTMLTextAreaElement&&a&&"color"===o&&applySpanStyle(i,`color:${a}`)})})):(u=[],e.textContent="No posts yet",void(n.innerHTML='<div class="blog-post">Publish your first post on the right.</div>'))}setupComposeToolbar(a),t.textContent="Supabase connected",setFormEnabled(a,!1),o&&(o.style.display="none"),c.style.display="none",r.addEventListener("submit",async e=>{e.preventDefault();const t=i.value.trim(),n=l.value.trim();if(!t||!n)return;const{data:o,error:a}=await m.auth.signInWithPassword({email:t,password:n});a?s.textContent=`Sign-in failed: ${a.message}`:p(o.session)}),c.addEventListener("click",async()=>{await m.auth.signOut(),await g()}),m.auth.onAuthStateChange((e,t)=>{p(t)}),window.addEventListener("hashchange",h),await y(),scheduleHashAlignment(),await g(),m.channel("posts").on("postgres_changes",{event:"*",schema:"public",table:"posts"},()=>y()).subscribe(),a.addEventListener("submit",async t=>{t.preventDefault();const{data:{session:_authSession}}=await m.auth.getSession();if(!_authSession){alert("Please sign in via Admin to publish.");return;}const n=new FormData(a),o=generateClientPostId(),r={id:o,slug:buildStablePostSlug(n.get("title"),o),title:n.get("title"),summary:n.get("summary"),content:n.get("content"),tags:String(n.get("tags")||"").split(",").map(e=>e.trim()).filter(Boolean),published_at:(new Date).toISOString()},{error:i}=await m.from("posts").insert(r);i?e.textContent=`Publish failed: ${i.message}`:(a.reset(),e.textContent="Published")})}function renderMarkdown(e){if(!e)return"";if(window.marked&&window.DOMPurify){window.__purifyConfigured||(window.DOMPurify.setConfig({ALLOWED_TAGS:["a","b","blockquote","br","code","em","h1","h2","h3","h4","h5","h6","i","li","ol","p","pre","span","strong","u","ul"],ALLOWED_ATTR:["href","target","rel","style"]}),window.DOMPurify.addHook("uponSanitizeAttribute",(e,t)=>{if("style"!==t.attrName)return;const n=String(t.attrValue||"").split(";").map(e=>e.trim()).filter(Boolean),o=new Set(["D-DIN","JetBrains Mono","SFMono-Regular","ui-monospace","Menlo","Monaco","Consolas","Liberation Mono","Courier New","monospace"]),a=[];for(const e of n){const[t,...n]=e.split(":"),r=(t||"").trim().toLowerCase(),i=n.join(":").trim();if(r&&i){if("color"===r){if(!i.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/))continue;a.push(`color:${i.toLowerCase()}`);continue}if("font-size"===r){const e=i.match(/^([0-9]{1,2})(px)$/);if(!e)continue;const t=Number(e[1]);if(t<10||t>32)continue;a.push(`font-size:${t}px`);continue}if("font-family"===r){const e=i.split(",").map(e=>e.trim().replaceAll('"',"").replaceAll("'","")).filter(Boolean).filter(e=>o.has(e));if(!e.length)continue;a.push(`font-family:${e.map(e=>`"${e}"`).join(",")}`);continue}if("text-decoration"!==r);else{if("underline"!==i)continue;a.push("text-decoration:underline")}}}t.attrValue=a.join(";")}),window.__purifyConfigured=!0);const t=window.marked.parse(e,{breaks:!0});return window.DOMPurify.sanitize(t)}return escapeHtml(e)}function stripHtml(e){const t=document.createElement("div");return t.innerHTML=e||"",t.textContent||t.innerText||""}function calculateReadingTime(e){const t=stripHtml(String(e||"")).replace(/\s+/g," ").trim();if(!t)return 1;const n=t.split(" ").filter(Boolean).length;return Math.max(1,Math.ceil(n/220))}function clampText(e,t=120){if(!e)return"";const n=e.replace(/\s+/g," ").trim();return n.length<=t?n:`${n.slice(0,t-1)}…`}function buildShareHref(e,t){if(window.SocialShare?.buildShareHref)return window.SocialShare.buildShareHref(e,t);const n=encodeURIComponent(t);return"linkedin"===e?`https://www.linkedin.com/sharing/share-offsite/?url=${n}`:"x"===e?`https://x.com/intent/post?url=${n}`:"#"}function getShareBaseUrl(){const e=document.querySelector("link[rel='canonical']");if(e?.href)try{const t=new URL(e.href,window.location.href);return t.hash="",t.search="",t.toString()}catch(e){}const t=new URL(window.location.href);return t.hash="",t.search="",t.toString()}function slugifyPostTitle(e){return String(e||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/-{2,}/g,"-").replace(/^-+|-+$/g,"")||"post"}function getPostIdSuffix(e){return String(e||"").replace(/[^a-zA-Z0-9]/g,"").slice(-8).toLowerCase()}function buildStablePostSlug(e,t){const n=slugifyPostTitle(e),o=getPostIdSuffix(t);return o?`${n}-${o}`:n}function generateClientPostId(){if(window.crypto?.randomUUID)return window.crypto.randomUUID();const e=()=>Math.floor(65536*(1+Math.random())).toString(16).slice(1);return`${e()}${e()}-${e()}-${e()}-${e()}-${e()}${e()}${e()}`}const GOINGVEGAN_BLOG_SLUGS=new Set(["how-many-animals-does-going-vegan-save-per-year","the-psychology-of-vegan-streaks-why-tracking-your-plant-based-days-works","going-vegan-without-losing-muscle-a-practical-guide"]);function normalizePostTags(e){return Array.isArray(e)?e.map(e=>String(e||"").trim().toLowerCase()).filter(Boolean):String(e||"").split(",").map(e=>e.trim().toLowerCase()).filter(Boolean)}function isGoingVeganBlogPost(e){const t=String(e?.slug||"").replace(/-[a-f0-9]{8}$/i,"").toLowerCase();if(GOINGVEGAN_BLOG_SLUGS.has(t))return!0;const n=normalizePostTags(e?.tags);return n.includes("goingvegan")||n.includes("vegan")}function buildCanonicalPostSlug(e){const t=slugifyPostTitle(e?.title||"");if(t)return t;const n=String(e?.slug||"").replace(/-[a-f0-9]{8}$/i,"").toLowerCase();return n||"post"}function buildCanonicalSlugById(e){const t=new Map,n=new Map;return e.forEach(e=>{const o=buildCanonicalPostSlug(e),a=(t.get(o)||0)+1;t.set(o,a);const r=1===a?o:`${o}-${a}`;n.set(String(e.id),r)}),n}function buildPostSlugMap(e){const t=buildCanonicalSlugById(e);return e.filter(e=>!isGoingVeganBlogPost(e)).map(e=>({...e,shareSlug:t.get(String(e.id))||buildCanonicalPostSlug(e)}))}function buildBlogPostPath(e){return`/blog/${encodeURIComponent(e)}/`}function buildBlogPostUrl(e){return`${new URL(getShareBaseUrl()).origin}${buildBlogPostPath(e)}`}function getShareIcon(e){return"linkedin"===e?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.5 8h4V23h-4zM8 8h3.83v2.05h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.09V23h-4v-7.29c0-1.74-.03-3.98-2.42-3.98-2.42 0-2.79 1.89-2.79 3.85V23H8z" fill="currentColor"></path></svg>':"x"===e?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.9 2H22l-6.8 7.78L23.2 22h-6.27l-4.9-6.93L6.03 22H2.9l7.28-8.32L.6 2h6.43l4.43 6.27zM17.8 20h1.73L6.1 3.9H4.25z" fill="currentColor"></path></svg>':"copy"===e?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12z" fill="currentColor"></path><path d="M8 5h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v14h12V7z" fill="currentColor"></path></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 16.08a2.94 2.94 0 0 0-1.95.77l-6.32-3.69a2.8 2.8 0 0 0 0-2.32l6.32-3.7A3 3 0 1 0 15 5a2.8 2.8 0 0 0 .05.51l-6.32 3.7a3 3 0 1 0 0 5.58l6.32 3.7A2.8 2.8 0 0 0 15 19a3 3 0 1 0 3-2.92z" fill="currentColor"></path></svg>'}function normalizeEmail(e){return String(e||"").trim().toLowerCase()}function readCookie(e){const t=encodeURIComponent(e),n=document.cookie.split("; ").find(e=>e.startsWith(`${t}=`));return n?decodeURIComponent(n.slice(t.length+1)):""}function setHasBookedCookie(e){const t="https:"===window.location.protocol?"; Secure":"";document.cookie=e?`hasBooked=true; Max-Age=31449600; Path=/; SameSite=Lax${t}`:`hasBooked=; Max-Age=0; Path=/; SameSite=Lax${t}`}async function setupBooking(){
  const emailInput=document.getElementById("booking-email");
  const bookingLink=document.getElementById("career-booking-link");
  const validationEl=document.getElementById("booking-email-validation");
  if(!(emailInput instanceof HTMLInputElement))return;
  if(!(bookingLink instanceof HTMLAnchorElement))return;

  const state={
    email:"",
    hasBooked:!1,
    targetUrl:"",
    lookupId:0
  };

  function setValidation(message){
    if(validationEl)validationEl.textContent=message;
  }

  function setButtonDisabled(disabled){
    bookingLink.classList.toggle("is-disabled",disabled);
    bookingLink.setAttribute("aria-disabled",disabled?"true":"false");
    bookingLink.tabIndex=disabled?-1:0;
    if(disabled)bookingLink.href="#";
  }

  function isValidEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function buildPaidUrl(email){
    const url=new URL(PAID_STRIPE_LINK);
    if(email)url.searchParams.set("prefilled_email",email);
    return url.toString();
  }

  async function bookingIntake(email){
    const token=localStorage.getItem("bookingToken")||"";
    const response=await fetch(`${SUPABASE_FUNCTIONS_BASE}/booking-intake`,{
      method:"POST",
      credentials:"include",
      headers:{
        "Content-Type":"application/json",
        ...(token?{"x-booking-token":token}:{})
      },
      body:JSON.stringify({email})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||`Intake failed: ${response.status}`);
    if(payload.token)localStorage.setItem("bookingToken",payload.token);
  }

  async function fetchBookingStatus(email,{forceRefresh=!1}={}){
    const url=new URL(`${SUPABASE_FUNCTIONS_BASE}/booking-status`);
    url.searchParams.set("email",email);
    if(forceRefresh)url.searchParams.set("refresh","1");
    const token=localStorage.getItem("bookingToken")||"";
    const response=await fetch(url.toString(),{
      method:"GET",
      credentials:"include",
      headers:token?{"x-booking-token":token}:{}
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||`Request failed: ${response.status}`);
    if(payload.token)localStorage.setItem("bookingToken",payload.token);
    return payload;
  }

  async function resolveTargetUrl(email,requestId,{forceRefresh=!1,allowFallback=!1}={}){
    const normalized=normalizeEmail(email);
    if(!normalized)return;

    try{
      await bookingIntake(normalized);
    }catch(error){
      console.warn("booking-intake failed",error);
    }

    try{
      const payload=await fetchBookingStatus(normalized,{forceRefresh});
      if(requestId!==state.lookupId)return;
      state.hasBooked=Boolean(payload.hasBooked);
      setHasBookedCookie(state.hasBooked);
      state.targetUrl=state.hasBooked?buildPaidUrl(normalized):FREE_CAL_LINK;
      setButtonDisabled(!isValidEmail(normalized));
      setValidation("Email valid. Booking ready.");
    }catch(error){
      if(requestId!==state.lookupId)return;
      console.warn("booking-status failed",error);
      state.hasBooked=!1;
      setHasBookedCookie(!1);
      if(allowFallback){
        state.targetUrl=FREE_CAL_LINK;
        setButtonDisabled(!isValidEmail(normalized));
        setValidation("Email valid. Booking ready.");
      }else{
        state.targetUrl="";
        setButtonDisabled(!0);
        setValidation("Could not verify booking status. Edit email and retry.");
      }
    }
  }

  async function validateEmailInput({background=!1}={}){
    const email=normalizeEmail(emailInput.value);
    state.email=email;

    if(!email){
      state.targetUrl="";
      setButtonDisabled(!0);
      setValidation("Enter a valid email address to enable booking.");
      return;
    }

    if(!isValidEmail(email)){
      state.targetUrl="";
      setButtonDisabled(!0);
      setValidation("Please enter a valid email address.");
      return;
    }

    setButtonDisabled(!1);
    setValidation("Email valid. Booking ready.");

    if(background){
      state.lookupId+=1;
      const reqId=state.lookupId;
      await resolveTargetUrl(email,reqId,{forceRefresh:!1,allowFallback:!0});
    }
  }

  bookingLink.addEventListener("click",async event=>{
    event.preventDefault();
    const email=normalizeEmail(state.email||emailInput.value);
    if(!isValidEmail(email)){
      setButtonDisabled(!0);
      setValidation("Please enter a valid email address.");
      return;
    }

    setButtonDisabled(!0);
    setValidation("Checking latest booking history...");
    state.lookupId+=1;
    const requestId=state.lookupId;
    await resolveTargetUrl(email,requestId,{forceRefresh:!0,allowFallback:!0});

    if(requestId!==state.lookupId)return;

    if(!state.targetUrl){
      state.targetUrl=FREE_CAL_LINK;
    }

    const flow=state.hasBooked?"paid":"free";
    window.siteAnalytics?.track(`open_booking_page_click:${flow}`,{title:`Open booking page (${flow})`});
    bookingLink.href=state.targetUrl;
    window.location.assign(state.targetUrl);
  });

  let userInteracted=!1;
  const markInteracted=()=>{userInteracted=!0;};
  ["focus","keydown","pointerdown","touchstart"].forEach(evt=>emailInput.addEventListener(evt,markInteracted));
  const inputEvents=["input","change","blur","keyup","paste"];
  inputEvents.forEach(evt=>emailInput.addEventListener(evt,()=>{markInteracted(),validateEmailInput({background:evt!=="keyup"});}));

  emailInput.value="";
  setButtonDisabled(!0);
  setValidation("Enter a valid email address to enable booking.");
  await validateEmailInput({background:!0});
  setTimeout(()=>{
    if(userInteracted)return;
    if(!emailInput.value)return;
    emailInput.value="";
    state.email="";
    state.targetUrl="";
    setButtonDisabled(!0);
    setValidation("Enter a valid email address to enable booking.");
  },800);
  setTimeout(()=>{validateEmailInput({background:!0});},250);
  setTimeout(()=>{validateEmailInput({background:!0});},1200);
}
function fetchWithTimeout(e,t={},n=12e3){const o=new AbortController,a=setTimeout(()=>o.abort(),n);return fetch(e,{...t,signal:o.signal}).finally(()=>clearTimeout(a))}function getJinaUrl(e){return`https://r.jina.ai/http://${e.replace(/^https?:\/\//,"")}`}async function fetchTextWithFallbacks(e){const t=[{label:"direct",url:e,type:"text"},{label:"allorigins-raw",url:`${CORS_PROXY}${encodeURIComponent(e)}`,type:"text"},{label:"allorigins-json",url:`${CORS_PROXY_JSON}${encodeURIComponent(e)}`,type:"json"},{label:"jina",url:getJinaUrl(e),type:"text"}];let n=null;for(const e of t)try{const t=await fetchWithTimeout(e.url,{},12e3);if(!t.ok){n=new Error(`${e.label}: ${t.status}`);continue}if("json"===e.type){const o=await t.json();if(!o.contents){n=new Error(`${e.label}: empty response`);continue}return o.contents}return await t.text()}catch(t){n=new Error(`${e.label}: ${t.message}`)}throw n||new Error("Load failed")}async function fetchOPMLFeeds(){const e=await fetchTextWithFallbacks(OPML_URL),t=(new DOMParser).parseFromString(e,"text/xml");return Array.from(t.querySelectorAll("outline[xmlUrl]")).map(e=>({title:e.getAttribute("title")||e.getAttribute("text")||"Feed",url:e.getAttribute("xmlUrl")}))}async function fetchFeed(e){const t=await fetchTextWithFallbacks(e.url),n=(new DOMParser).parseFromString(t,"text/xml"),o=Array.from(n.querySelectorAll("item"));if(o.length)return o.slice(0,5).map(t=>({title:t.querySelector("title")?.textContent||"Untitled",link:t.querySelector("link")?.textContent||"",date:t.querySelector("pubDate")?.textContent||"",summary:t.querySelector("description")?.textContent||t.querySelector("content:encoded")?.textContent||"",source:e.title}));return Array.from(n.querySelectorAll("entry")).slice(0,5).map(t=>({title:t.querySelector("title")?.textContent||"Untitled",link:t.querySelector("link")?.getAttribute("href")||"",date:t.querySelector("updated")?.textContent||"",summary:t.querySelector("summary")?.textContent||t.querySelector("content")?.textContent||"",source:e.title}))}function loadSeedRss(){const e=document.getElementById("rss-seed");if(!e)return null;try{const t=JSON.parse(e.textContent||"[]");return Array.isArray(t)&&t.length?t:null}catch(e){return null}}function loadCachedRss(){try{const e=localStorage.getItem("rss-cache");if(!e)return null;const t=JSON.parse(e);return t&&Array.isArray(t.items)?t:null}catch(e){return null}}function saveCachedRss(e,t){try{localStorage.setItem("rss-cache",JSON.stringify({saved_at:t||(new Date).toISOString(),items:e}))}catch(e){}}async function fetchLocalRss(){const e=`rss.json?ts=${Date.now()}`,t=await fetch(e);if(!t.ok)return null;const n=await t.json();return n&&Array.isArray(n.items)?n:null}function renderRssTimestamp(e){const t=document.getElementById("rss-updated");if(!t)return;if(!e)return void(t.textContent="");const n=new Date(e);t.textContent=`Last updated ${n.toLocaleString()}`}async function setupRSS(){const e=document.getElementById("rss-status"),t=document.getElementById("rss-list"),n=document.getElementById("rss-search"),o=document.getElementById("rss-refresh"),a=document.getElementById("rss-scroll-up"),r=document.getElementById("rss-scroll-down");if(!(e instanceof HTMLElement))return;if(!(t instanceof HTMLElement))return;if(!(n instanceof HTMLInputElement))return;if(!(o instanceof HTMLButtonElement))return;let i=[];function l(){if(!(a instanceof HTMLButtonElement&&r instanceof HTMLButtonElement))return;const e=Math.max(0,t.scrollHeight-t.clientHeight),n=e>1;a.disabled=!n||t.scrollTop<=1,r.disabled=!n||t.scrollTop>=e-1}function s(e=!1){const n=Array.from(t.querySelectorAll(".rss-item"));if(!n.length)return t.style.maxHeight="",void l();const o=window.getComputedStyle(t),a=Number.parseFloat(o.rowGap||o.gap||"0")||0,r=Math.min(5,n.length);let i=0;for(let e=0;e<r;e+=1){const t=n[e];t instanceof HTMLElement&&(i+=t.offsetHeight)}r>1&&(i+=a*(r-1)),t.style.maxHeight=`${Math.ceil(i)}px`,e&&(t.scrollTop=0),l()}function c(e){const n=function(){const e=t.querySelector(".rss-item");if(!(e instanceof HTMLElement))return 152;const n=window.getComputedStyle(t),o=Number.parseFloat(n.rowGap||n.gap||"0")||0;return e.offsetHeight+o}();t.scrollBy({top:e*n,behavior:"smooth"})}async function d({force:n}={force:!1}){e.textContent="Loading feeds...",t.innerHTML="",s(!0);try{if(n)try{localStorage.removeItem("rss-cache")}catch(e){}else{const t=loadSeedRss();t&&t.length&&(i=t.map(e=>({...e,dateValue:e.date?new Date(e.date).getTime():0})).sort((e,t)=>t.dateValue-e.dateValue).slice(0,40),e.textContent=`Showing latest ${Math.min(5,i.length)} of ${i.length} items (seeded)`,u(i),renderRssTimestamp((new Date).toISOString()));const n=loadCachedRss();n&&n.items&&n.items.length&&(i=n.items.map(e=>({...e,dateValue:e.date?new Date(e.date).getTime():0})).sort((e,t)=>t.dateValue-e.dateValue).slice(0,40),e.textContent=`Showing latest ${Math.min(5,i.length)} of ${i.length} items (cached)`,u(i),renderRssTimestamp(n.saved_at))}const o=await fetchLocalRss();if(o&&o.items&&o.items.length)return i=o.items.map(e=>({...e,dateValue:e.date?new Date(e.date).getTime():0})).sort((e,t)=>t.dateValue-e.dateValue).slice(0,40),e.textContent=`Showing latest ${Math.min(5,i.length)} of ${i.length} items`,u(i),renderRssTimestamp(o.generated_at||(new Date).toISOString()),void saveCachedRss(i,o.generated_at);e.textContent="Fetching feed list...";let a=[];try{a=(await fetchOPMLFeeds()).slice(0,36)}catch(t){a=FALLBACK_FEEDS.slice(0,36),e.textContent="Using fallback feeds..."}a.length||(a=FALLBACK_FEEDS.slice(0,36));const r=[],l=6;for(let e=0;e<a.length;e+=l)r.push(a.slice(e,e+l));const c=[];let d=0;for(const t of r){(await Promise.allSettled(t.map(fetchFeed))).forEach(e=>{d+=1,"fulfilled"===e.status&&c.push(...e.value)}),e.textContent=`Fetching feeds... ${d}/${a.length}`}if(i=c.filter(e=>e.link).map(e=>({...e,dateValue:e.date?new Date(e.date).getTime():0})).sort((e,t)=>t.dateValue-e.dateValue).slice(0,40),!i.length)return e.textContent=`No items loaded (0/${a.length} feeds). Try refresh.`,t.innerHTML="",void s(!0);e.textContent=`Showing latest ${Math.min(5,i.length)} of ${i.length} items from ${a.length} feeds`,u(i)}catch(n){e.textContent=`RSS load failed: ${n.message}`,t.innerHTML="",s(!0)}}function u(e){t.innerHTML=e.map(e=>`\n        <article class="rss-item">\n          <a href="${e.link}" target="_blank" rel="noreferrer">${e.title}</a>\n          <p class="rss-summary">${clampText(stripHtml(e.summary))||"No summary available."}</p>\n          <small>${e.source}${e.date?` • ${new Date(e.date).toLocaleDateString()}`:""}</small>\n        </article>\n      `).join(""),s(!0)}n.addEventListener("input",()=>{const e=n.value.toLowerCase();u(i.filter(t=>t.title.toLowerCase().includes(e)||t.source.toLowerCase().includes(e)))}),o.addEventListener("click",async()=>{o.disabled=!0,await d({force:!0}),o.disabled=!1}),t.addEventListener("scroll",l),a instanceof HTMLButtonElement&&a.addEventListener("click",()=>{c(-1)}),r instanceof HTMLButtonElement&&r.addEventListener("click",()=>{c(1)}),window.addEventListener("resize",()=>{s(!1)}),await d()}function lazySection(e,t){const n=document.getElementById(e);if(!n)return;const o=new IntersectionObserver(e=>{e[0].isIntersecting&&(o.disconnect(),t())},{rootMargin:"0px"});o.observe(n)}function setupLoomFacade(){document.querySelectorAll(".loom-facade").forEach(e=>{function t(){const t=e.dataset.src;if(!t)return;const n=document.createElement("iframe");n.src=t+"?autoplay=1",n.title=e.getAttribute("aria-label")||"Loom video",n.allow="autoplay; fullscreen",n.allowFullscreen=!0,n.style.cssText="border:0;display:block;width:100%;height:100%;",e.parentNode.replaceChild(n,e)}e.addEventListener("click",t),e.addEventListener("keydown",n=>{("Enter"===n.key||" "===n.key)&&(n.preventDefault(),t())})})}document.querySelectorAll(".reveal").forEach(e=>revealObserver.observe(e)),setupAbout(),setupTimeline(),setupPortfolio(),setupLoomFacade(),lazySection("blog",setupBlog),lazySection("career-acceleration",setupBooking),lazySection("rss",setupRSS);

// KA-03: Add timeout handling for blog and RSS loading
(function(){
  // Store original setupBlog
  const originalSetupBlog = window._setupBlog || setupBlog;
  const CONTENT_LOAD_TIMEOUT = 5000; // 5 seconds

  // Wrap setupBlog to add timeout
  window.setupBlog = async function() {
    const blogStatus = document.getElementById("blog-status");
    const blogList = document.getElementById("blog-list");
    if(!blogStatus || !blogList) return originalSetupBlog();

    const timeoutId = setTimeout(() => {
      if(blogStatus.textContent.includes("Loading")) {
        blogStatus.innerHTML = '<span style="color: #dc3545;">Unable to load content. Please try again later.</span>';
        blogList.innerHTML = '<button class="btn ghost" onclick="window.location.reload()">Retry</button>';
      }
    }, CONTENT_LOAD_TIMEOUT);

    try {
      await originalSetupBlog();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Similar timeout for RSS
  const originalSetupRSS = window._setupRSS || setupRSS;
  window.setupRSS = async function() {
    const rssStatus = document.getElementById("rss-status");
    const rssList = document.getElementById("rss-list");
    if(!rssStatus || !rssList) return originalSetupRSS();

    const timeoutId = setTimeout(() => {
      if(rssStatus.textContent.includes("Loading")) {
        rssStatus.innerHTML = '<span style="color: #dc3545;">Unable to load content. Please try again later.</span>';
        rssList.innerHTML = '<button class="btn ghost" onclick="window.location.reload()">Retry</button>';
      }
    }, CONTENT_LOAD_TIMEOUT);

    try {
      await originalSetupRSS();
    } finally {
      clearTimeout(timeoutId);
    }
  };
})();

// KA-17: Add blog search functionality
(function(){
  const blogList = document.getElementById("blog-list");
  const blogSection = document.getElementById("blog");
  if(!blogList || !blogSection) return;

  // Create search container
  const searchContainer = document.createElement("div");
  searchContainer.id = "blog-search-container";
  searchContainer.innerHTML = `
    <input 
      type="text" 
      class="blog-search-input" 
      id="blog-search-input" 
      placeholder="Search blog posts..."
      aria-label="Search blog posts by title or content"
    />
    <div class="blog-search-results" id="blog-search-results"></div>
  `;

  // Insert before blog list
  const blogGrid = blogList.closest(".blog-grid");
  if(blogGrid) {
    const blogPanel = blogList.closest(".blog-panel");
    if(blogPanel) {
      blogPanel.insertBefore(searchContainer, blogList);
    }
  }

  const searchInput = document.getElementById("blog-search-input");
  const searchResults = document.getElementById("blog-search-results");

  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const posts = blogList.querySelectorAll(".blog-post");
      let visibleCount = 0;

      posts.forEach(post => {
        const title = post.querySelector("h4")?.textContent.toLowerCase() || "";
        const summary = post.querySelector("p")?.textContent.toLowerCase() || "";
        const isVisible = title.includes(query) || summary.includes(query) || !query;
        
        post.style.display = isVisible ? "" : "none";
        if(isVisible) visibleCount++;
      });

      if(searchResults) {
        if(query) {
          searchResults.textContent = `Found ${visibleCount} post${visibleCount !== 1 ? 's' : ''}`;
        } else {
          searchResults.textContent = "";
        }
      }
    });
  }
})();
