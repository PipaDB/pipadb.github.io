import Fuse from 'fuse.js'
import { gsap } from 'gsap'
import './style.css'

const app = document.querySelector('#app')

const PAGE_SIZE = 12

// Tier taxonomy — ordered best to worst.
const STATUS_META = {
  platinum: { order: 1, label: 'Platinum', blurb: 'Runs perfectly out of the box' },
  gold: { order: 2, label: 'Gold', blurb: 'Runs perfectly after tweaks' },
  silver: { order: 3, label: 'Silver', blurb: 'Runs with minor issues' },
  bronze: { order: 4, label: 'Bronze', blurb: 'Runs, but crashes often' },
  middle: { order: 5, label: 'Middle', blurb: 'Playable, mixed experience' },
  config: { order: 6, label: 'Config', blurb: 'Needs additional configuration' },
  tweaking: { order: 7, label: 'Tweaking', blurb: 'Needs manual tweaks to launch' },
  borked: { order: 8, label: 'Borked', blurb: "Doesn't run" },
}

const tierOrder = (status) => STATUS_META[status]?.order ?? 99
const tierLabel = (status) => STATUS_META[status]?.label ?? status

// Family tags — color-coded by base distro.
const FAMILY = {
  alpine: { label: 'Alpine', color: '#4d9fd6' },
  arch: { label: 'Arch', color: '#1793d1' },
  fedora: { label: 'Fedora', color: '#5a8fd6' },
  atomic: { label: 'Fedora Atomic', color: '#c08bff' },
  recovery: { label: 'Recovery', color: '#ff7a2e' },
}

// Static reference links — not crowd-sourced, kept in code.
const DEVICE_LINKS = [
  { name: 'GSMArena', summary: 'Full specifications', url: 'https://www.gsmarena.com/xiaomi_pad_6-12237.php' },
  { name: 'NanoReview', summary: 'Benchmarks & review', url: 'https://nanoreview.net/en/tablet/xiaomi-pad-6' },
]

const TELEGRAM_URL = 'https://t.me/pipadb'

const state = {
  items: [],
  filtered: [],
  distros: [],
  recoveries: [],
  metadata: null,
  query: '',
  type: 'all',
  status: 'all',
  rendered: 0,
}

app.innerHTML = `
  <div class="min-h-screen">
    <nav class="sticky top-0 z-30 border-b-2 border-line bg-paper">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <a href="#top" class="flex items-center gap-2.5">
          <img src="./tux.png" alt="" class="h-8 w-auto" />
          <span class="font-display text-lg">pipaDB</span>
        </a>
        <div class="flex shrink-0 items-center gap-2">
          <a href="./api/index.json" class="btn-ghost hidden sm:inline-flex">API</a>
          <a href="${TELEGRAM_URL}" target="_blank" rel="noopener noreferrer" class="btn-ghost hidden sm:inline-flex">Telegram</a>
          <a href="https://github.com/PipaDB/pipadb.github.io" target="_blank" rel="noopener noreferrer" class="btn-primary">Submit report</a>
        </div>
      </div>
    </nav>

    <header id="top" class="border-b-2 border-line">
      <div class="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <div class="grid items-center gap-6 md:gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div class="hero-copy min-w-0">
            <span class="tier tier-platinum mb-5 inline-flex max-w-full whitespace-normal">Xiaomi Pad 6 · codename "pipa"</span>
            <h1 class="font-display text-[3.25rem] leading-[0.9] tracking-tight [word-break:break-word] sm:text-7xl md:text-[8.5rem]">
              Pipa<span class="text-brand">DB</span>
            </h1>
            <p class="mt-5 max-w-xl font-mono text-sm leading-relaxed text-ink/70 md:text-base">
              A community-driven compatibility database for games, apps, distros
              &amp; recoveries on the Xiaomi Pad 6.
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a href="#browse" class="btn-primary">Browse the database</a>
              <a href="./api/index.json" class="btn-ghost">View the API</a>
            </div>
            <a href="${TELEGRAM_URL}" target="_blank" rel="noopener noreferrer"
               class="mt-4 inline-flex items-center gap-2 font-mono text-sm font-bold text-brand transition hover:text-white">
              → Join the pipaDB Telegram group
            </a>
          </div>
          <div class="hero-stage relative h-52 overflow-hidden sm:h-64 md:h-96">
            <img
              id="hero-tablet"
              src="./pipa.png"
              alt="Xiaomi Pad 6 (pipa)"
              class="absolute left-1/2 top-1/2 h-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_25px_45px_rgba(0,0,0,0.85)]"
            />
          </div>
        </div>
      </div>
    </header>

    <section class="border-b-2 border-line bg-panel">
      <div class="mx-auto max-w-6xl px-4 py-7 md:px-6">
        <p class="label mb-4">Resources &amp; useful links</p>
        <div id="resources" class="space-y-6"></div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div id="stat-row" class="grid grid-cols-2 gap-4 md:grid-cols-4"></div>
    </section>

    <main id="browse" class="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 md:px-6">
      <div class="box-shadow p-4 md:p-5">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <label class="sr-only" for="search">Search</label>
            <input id="search" type="search" placeholder="search title / tester / tag…" class="field w-full" />
          </div>
          <div>
            <label class="sr-only" for="type-filter">Type</label>
            <select id="type-filter" class="field w-full">
              <option value="all">All types</option>
              <option value="game">Games</option>
              <option value="app">Apps</option>
            </select>
          </div>
          <div>
            <label class="sr-only" for="status-filter">Tier</label>
            <select id="status-filter" class="field w-full">
              <option value="all">All tiers</option>
            </select>
          </div>
        </div>
        <div id="tier-legend" class="mt-4 flex flex-wrap gap-2 border-t-2 border-line/15 pt-4"></div>
      </div>

      <div class="mb-5 mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="font-display text-2xl">Compatibility reports</h2>
        <p id="results-summary" class="label"></p>
      </div>
      <div id="results" class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"></div>
      <div class="mt-8 flex justify-center">
        <button id="load-more" class="btn-ghost hidden">Load more</button>
      </div>
    </main>

    <footer class="border-t-2 border-line bg-panel">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center md:px-6">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <a href="${TELEGRAM_URL}" target="_blank" rel="noopener noreferrer" class="btn-ghost">Telegram group</a>
          <a href="https://github.com/PipaDB/pipadb.github.io" target="_blank" rel="noopener noreferrer" class="btn-ghost">GitHub</a>
        </div>
        <p class="font-mono text-xs text-ink/55">pipaDB — unofficial community database. Not affiliated with Xiaomi or ProtonDB.</p>
        <p id="meta-guidance" class="font-mono text-xs text-ink/45"></p>
      </div>
    </footer>
  </div>
`

const searchInput = document.querySelector('#search')
const typeFilter = document.querySelector('#type-filter')
const statusFilter = document.querySelector('#status-filter')
const resultsSummary = document.querySelector('#results-summary')
const resultsContainer = document.querySelector('#results')
const guidanceText = document.querySelector('#meta-guidance')
const statRow = document.querySelector('#stat-row')
const tierLegend = document.querySelector('#tier-legend')
const resourcesEl = document.querySelector('#resources')
const loadMoreBtn = document.querySelector('#load-more')

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value.trim()
  applyFilters()
})

typeFilter.addEventListener('change', (event) => {
  state.type = event.target.value
  applyFilters()
})

statusFilter.addEventListener('change', (event) => {
  state.status = event.target.value
  applyFilters()
})

loadMoreBtn.addEventListener('click', () => renderPage(false))

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const linkCardHtml = (item) => {
  const fam = item.family ? FAMILY[item.family] : null
  const tag = fam
    ? `<span class="shrink-0 border-2 px-1.5 py-0 font-mono text-[10px] font-bold uppercase"
             style="border-color:${fam.color};color:${fam.color}">${fam.label}</span>`
    : ''
  return `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer"
       class="box flex min-w-0 items-center justify-between gap-3 px-4 py-3 transition
              hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-brand hover:shadow-hard-sm">
      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-2">
          <span class="font-bold [overflow-wrap:anywhere]">${escapeHtml(item.name)}</span>
          ${tag}
        </span>
        <span class="mt-0.5 block font-mono text-[11px] text-muted [overflow-wrap:anywhere]">${escapeHtml(item.summary ?? '')}</span>
      </span>
      <span aria-hidden="true" class="shrink-0 font-display text-lg">↗</span>
    </a>
  `
}

// Collapsible group with a show/hide toggle button.
const collapsibleHtml = (id, title, items) => {
  const cards = items.length
    ? items.map(linkCardHtml).join('')
    : `<p class="font-mono text-sm text-muted">No entries yet — submit one to <code>${id.replace('grp-', '')}/</code>.</p>`
  return `
    <div class="box-shadow">
      <button type="button" class="collapse-toggle flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              data-target="${id}" aria-expanded="true">
        <span class="font-display text-base">${escapeHtml(title)}
          <span class="text-muted">· ${items.length}</span>
        </span>
        <span class="chevron font-display text-xl leading-none transition-transform duration-200">▾</span>
      </button>
      <div id="${id}" class="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        ${cards}
      </div>
    </div>
  `
}

const renderResources = () => {
  resourcesEl.innerHTML = `
    <div>
      <p class="label mb-2.5">The device</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        ${DEVICE_LINKS.map(linkCardHtml).join('')}
      </div>
    </div>
    ${collapsibleHtml('grp-distros', 'Linux distros', state.distros)}
    ${collapsibleHtml('grp-recoveries', 'Recoveries', state.recoveries)}
  `
}

resourcesEl.addEventListener('click', (event) => {
  const button = event.target.closest('.collapse-toggle')
  if (!button) return
  const body = document.getElementById(button.dataset.target)
  const open = button.getAttribute('aria-expanded') === 'true'
  button.setAttribute('aria-expanded', String(!open))
  body.classList.toggle('hidden', open)
  button.querySelector('.chevron').style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)'
})

const renderStats = () => {
  const stats = state.metadata?.stats ?? {}
  const cards = [
    { label: 'Total entries', value: stats.total ?? state.items.length },
    { label: 'Games', value: stats.byType?.game ?? 0 },
    { label: 'Apps', value: stats.byType?.app ?? 0 },
    { label: 'Platinum tier', value: stats.byStatus?.platinum ?? 0 },
  ]
  statRow.innerHTML = cards
    .map(
      (card) => `
        <div class="box-shadow px-4 py-4">
          <p class="stat-value font-display text-4xl" data-value="${card.value}">0</p>
          <p class="label mt-1">${card.label}</p>
        </div>
      `,
    )
    .join('')
}

const renderTierLegend = () => {
  const counts = {}
  state.items.forEach((item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1
  })
  tierLegend.innerHTML = Object.keys(STATUS_META)
    .map((status) => {
      const meta = STATUS_META[status]
      const n = counts[status] ?? 0
      const dim = n === 0 ? 'opacity-40' : ''
      return `
        <span class="flex items-center gap-1.5 ${dim}" title="${escapeHtml(meta.blurb)}">
          <span class="tier tier-${status}">${meta.label}</span>
          <span class="font-mono text-[11px] text-ink/50">${meta.blurb} · ${n}</span>
        </span>
      `
    })
    .join('')
}

const cardHtml = (item) => {
  const meta = STATUS_META[item.status] ?? { label: item.status, blurb: '' }
  const tags = (item.tags ?? [])
    .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
    .join('')
  const notes = item.notes
    ? `<p class="mt-3 border-t-2 border-line/15 pt-3 font-mono text-[13px] leading-relaxed text-ink/70">${escapeHtml(item.notes)}</p>`
    : ''
  const protonLine = item.proton
    ? `<div class="flex justify-between gap-3"><span class="label shrink-0">Proton</span><span class="min-w-0 text-right font-bold [overflow-wrap:anywhere]">${escapeHtml(item.proton)}</span></div>`
    : ''
  const storeLine = item.store ? `<span class="chip">${escapeHtml(item.store)}</span>` : ''

  return `
    <article class="entry-card">
      <div class="stripe-${item.status} h-2 border-b-2 border-line"></div>
      <div class="flex flex-1 flex-col p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="label">${escapeHtml(item.type)}</p>
            <h3 class="mt-1 truncate font-display text-xl">${escapeHtml(item.name)}</h3>
          </div>
          <span class="tier tier-${item.status} shrink-0" title="${escapeHtml(meta.blurb)}">${escapeHtml(meta.label)}</span>
        </div>
        <div class="mt-3 space-y-1.5 text-sm">
          <div class="flex justify-between gap-3"><span class="label shrink-0">Tested by</span><span class="min-w-0 text-right font-bold [overflow-wrap:anywhere]">${escapeHtml(item.tb)}</span></div>
          <div class="flex justify-between gap-3"><span class="label shrink-0">Compat</span><span class="min-w-0 text-right font-bold [overflow-wrap:anywhere]">${escapeHtml(item.compatibility)}</span></div>
          ${protonLine}
        </div>
        ${notes}
        <div class="mt-3 flex flex-wrap items-center gap-1.5">${storeLine}${tags}</div>
        <a class="mt-4 inline-flex w-fit border-b-2 border-line font-mono text-xs font-bold uppercase tracking-wide transition hover:text-brand" href="./api/items/${encodeURIComponent(item.id)}.json">Per-title JSON ↗</a>
      </div>
    </article>
  `
}

// Renders one page at a time so the full DB is never dumped into the DOM at once.
const renderPage = (reset) => {
  if (reset) {
    state.rendered = 0
    resultsContainer.innerHTML = ''
  }

  resultsSummary.textContent = `${state.filtered.length} of ${state.items.length} entries`

  if (state.filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="box-shadow col-span-full p-12 text-center">
        <p class="font-display text-xl">No matches found</p>
        <p class="mt-1.5 font-mono text-sm text-ink/55">Try a broader search or reset the filters.</p>
      </div>
    `
    loadMoreBtn.classList.add('hidden')
    return
  }

  const start = state.rendered
  const slice = state.filtered.slice(start, start + PAGE_SIZE)
  resultsContainer.insertAdjacentHTML('beforeend', slice.map(cardHtml).join(''))
  state.rendered += slice.length

  const cards = [...resultsContainer.querySelectorAll('.entry-card')].slice(start)
  gsap.fromTo(
    cards,
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.03 },
  )

  const remaining = state.filtered.length - state.rendered
  if (remaining > 0) {
    loadMoreBtn.textContent = `Load ${Math.min(PAGE_SIZE, remaining)} more (${remaining} left)`
    loadMoreBtn.classList.remove('hidden')
  } else {
    loadMoreBtn.classList.add('hidden')
  }
}

const applyFilters = () => {
  let filtered = [...state.items]

  if (state.type !== 'all') {
    filtered = filtered.filter((item) => item.type === state.type)
  }

  if (state.status !== 'all') {
    filtered = filtered.filter((item) => item.status === state.status)
  }

  if (state.query) {
    const fuse = new Fuse(filtered, {
      threshold: 0.33,
      ignoreLocation: true,
      keys: ['name', 'tb', 'compatibility', 'notes', 'tags'],
    })
    filtered = fuse.search(state.query).map((result) => result.item)
  }

  filtered.sort(
    (a, b) => tierOrder(a.status) - tierOrder(b.status) || a.name.localeCompare(b.name),
  )

  state.filtered = filtered
  renderPage(true)
}

const populateStatusFilter = () => {
  const statuses = [...new Set(state.items.map((item) => item.status))]
  statuses
    .sort((a, b) => tierOrder(a) - tierOrder(b))
    .forEach((status) => {
      const option = document.createElement('option')
      option.value = status
      option.textContent = tierLabel(status)
      statusFilter.append(option)
    })
}

const playIntro = () => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from('.hero-copy > *', {
    y: 24,
    autoAlpha: 0,
    duration: 0.5,
    stagger: 0.07,
    clearProps: 'opacity,visibility,transform',
  })

  // The Pad 6 slides out from behind the wordmark.
  tl.fromTo(
    '#hero-tablet',
    { xPercent: -150, yPercent: -50, autoAlpha: 0, rotate: -10 },
    { xPercent: -50, yPercent: -50, autoAlpha: 1, rotate: 0, duration: 1, ease: 'power3.out' },
    '-=0.35',
  )

  gsap.utils.toArray('.stat-value').forEach((el) => {
    const target = Number(el.dataset.value) || 0
    const counter = { v: 0 }
    gsap.to(counter, {
      v: target,
      duration: 1.1,
      ease: 'power2.out',
      delay: 0.4,
      onUpdate: () => {
        el.textContent = Math.round(counter.v)
      },
    })
  })

  gsap.to('#hero-tablet', {
    yPercent: -53,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1,
  })
}

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} (${response.status})`)
  return response.json()
}

const init = async () => {
  // Distros & recoveries are independent — load them even if the main index fails.
  Promise.allSettled([fetchJson('./api/distros.json'), fetchJson('./api/recoveries.json')]).then(
    ([distros, recoveries]) => {
      state.distros = distros.status === 'fulfilled' ? distros.value : []
      state.recoveries = recoveries.status === 'fulfilled' ? recoveries.value : []
      renderResources()
    },
  )

  try {
    const payload = await fetchJson('./api/index.json')
    state.items = payload.items ?? []
    state.metadata = payload
    guidanceText.textContent = payload.guidance ?? ''

    renderStats()
    renderTierLegend()
    populateStatusFilter()
    applyFilters()
    playIntro()
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="box-shadow col-span-full p-10 text-center">
        <p class="font-display text-xl text-tier-borked">Failed to load pipaDB data.</p>
        <p class="mt-2 font-mono text-sm text-ink/60">${escapeHtml(error.message)}</p>
      </div>
    `
  }
}

init()
