import './style.css'

type StepType = 'prep' | 'mixing' | 'fermentation' | 'rest' | 'shaping' | 'baking'
type ItemCategory = 'flour' | 'starter' | 'basic' | 'other'
type ItemTag = 'flour' | 'starter' | 'water' | 'sugar' | 'butter' | 'yeast' | 'egg' | 'other'

type RecipeItem = {
  id: string
  category: ItemCategory
  tag: ItemTag
  name: string
  weight: number
  hydrationPct?: number
  starterEggCount?: number
  starterEggUnitWeight?: number
  starterFlour?: number
  starterRatio?: string
  starterWater?: number
  starterYeastWeight?: number
  waterContentPct?: number
  eggCount?: number
  eggUnitWeight?: number
  starterType?: string
  yeastType?: string
}
type JournalStep = {
  id: string
  type: StepType
  name: string
  notes: string
  itemIds: string[]
  timeValue?: number
  timeUnit?: 'min' | 'hr'
  temperature?: number
  temperatureUnit?: 'F' | 'C'
}
type DropdownOption = {
  value: string
  label: string
}
type ActivePage = 'formula' | 'steps' | 'cook'
type CookState = {
  checked: Record<string, string[]>
  completedAt?: number
  currentIndex: number
  now: number
  stepStartedAt?: number
  timerEndsAt?: number
  timerStepId?: string
  totalStartedAt?: number
}

const STORAGE_KEY = 'baking-journal:recipe'
const ITEMS_STORAGE_KEY = 'baking-journal:recipe-items'
const RECIPE_NAME_STORAGE_KEY = 'baking-journal:recipe-name'
const STEPS_STORAGE_KEY = 'baking-journal:steps'

const defaultItems: RecipeItem[] = [
  { id: 'flour-1', category: 'flour', tag: 'flour', name: '面粉', weight: 500 },
  { id: 'water-1', category: 'basic', tag: 'water', name: '水', weight: 350 },
  { id: 'butter-1', category: 'basic', tag: 'butter', name: '黄油', weight: 40 },
  { id: 'yeast-1', category: 'basic', tag: 'yeast', name: '干酵母', weight: 5, yeastType: '干酵母' },
  { id: 'sugar-1', category: 'basic', tag: 'sugar', name: '糖', weight: 35 }
]

const stepLabels: Record<StepType, string> = {
  prep: '准备',
  mixing: '打面',
  fermentation: '发酵',
  rest: '松弛',
  shaping: '整形',
  baking: '烘烤'
}
const categoryLabels: Record<ItemCategory, string> = {
  flour: '面粉',
  starter: '种面',
  basic: '基础材料',
  other: '其他'
}

const basicOptions = [
  { tag: 'water', label: '水' },
  { tag: 'butter', label: '黄油' },
  { tag: 'yeast', label: '酵母' },
  { tag: 'egg', label: '鸡蛋' },
  { tag: 'sugar', label: '糖' }
] satisfies Array<{ tag: ItemTag; label: string }>

const starterOptions = ['鲁邦种', '液种', '汤种', '烫种', '波兰种']
const starterRatioOptions = ['1:1', '2:1', '5:1']
const starterTypeDefaultRatio: Record<string, string> = {
  鲁邦种: '1:1',
  液种: '5:1',
  汤种: '5:1',
  烫种: '1:1',
  波兰种: '1:1'
}
const starterRatioHydration: Record<string, number> = {
  '1:1': 100,
  '2:1': 200,
  '5:1': 500
}
const starterHydrationPresets: Record<string, number> = {
  鲁邦种: 100,
  液种: 500,
  汤种: 500,
  烫种: 100,
  波兰种: 100
}

const createId = () => crypto.randomUUID()

const createItem = (category: ItemCategory, tag?: ItemTag): RecipeItem => {
  if (category === 'flour') {
    return { id: createId(), category, tag: 'flour', name: '面粉', weight: 100 }
  }

  if (category === 'starter') {
    return {
      id: createId(),
      category,
      tag: 'starter',
      name: '鲁邦种',
      weight: 100,
      hydrationPct: 100,
      starterFlour: 50,
      starterRatio: '1:1',
      starterWater: 50,
      starterType: '鲁邦种'
    }
  }

  if (category === 'other') {
    return { id: createId(), category, tag: 'other', name: '自定义', weight: 20 }
  }

  if (tag === 'egg') {
    return {
      id: createId(),
      category,
      tag,
      name: '鸡蛋',
      weight: 45,
      eggCount: 1,
      eggUnitWeight: 45,
      waterContentPct: 75
    }
  }

  if (tag === 'yeast') {
    return { id: createId(), category, tag, name: '干酵母', weight: 5, yeastType: '干酵母' }
  }

  const label = basicOptions.find((option) => option.tag === tag)?.label ?? '水'
  return { id: createId(), category, tag: tag ?? 'water', name: label, weight: tag === 'sugar' ? 35 : 50 }
}

const loadRecipeItems = (): RecipeItem[] => {
  const modernRaw = localStorage.getItem(ITEMS_STORAGE_KEY)

  if (modernRaw) {
    try {
      return JSON.parse(modernRaw)
    } catch {
      return defaultItems
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('baking-journal:formula')

  if (!raw) return defaultItems

  try {
    const data = JSON.parse(raw)
    const flour = Number(data.flour) || 500

    return [
      { id: 'flour-1', category: 'flour', tag: 'flour', name: '面粉', weight: flour },
      { id: 'water-1', category: 'basic', tag: 'water', name: '水', weight: Number(data.water) || 350 },
      { id: 'butter-1', category: 'basic', tag: 'butter', name: '黄油', weight: Number(data.butter) || 40 },
      {
        id: 'yeast-1',
        category: 'basic',
        tag: 'yeast',
        name: '干酵母',
        weight: Number(data.yeast) || 5,
        yeastType: '干酵母'
      },
      { id: 'sugar-1', category: 'basic', tag: 'sugar', name: '糖', weight: Number(data.sugar) || 35 }
    ]
  } catch {
    return defaultItems
  }
}

const loadSteps = (): JournalStep[] => {
  const raw = localStorage.getItem(STEPS_STORAGE_KEY)

  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<Omit<JournalStep, 'itemIds'> & { itemIds?: string[] }>
    return parsed.map((step) => ({
      ...step,
      itemIds: step.itemIds ?? []
    }))
  } catch {
    return []
  }
}

const saveSteps = (steps: JournalStep[]) => {
  localStorage.setItem(STEPS_STORAGE_KEY, JSON.stringify(steps))
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttr = (value: string) => escapeHtml(value).replace(/"/g, '&quot;')

const formatInputNumber = (value: number, precision = 1) => {
  const rounded = Number(value.toFixed(precision))
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const formatWeight = (grams: number, gramPrecision = 0) =>
  grams >= 1000
    ? `${formatInputNumber(grams / 1000, 3)}kg`
    : `${formatInputNumber(grams, gramPrecision)}g`

const getFlourContribution = (item: RecipeItem) => {
  if (item.category === 'flour') return item.weight
  if (item.category !== 'starter') return 0
  if (typeof item.starterFlour === 'number') return item.starterFlour
  const hydration = (item.hydrationPct ?? starterRatioHydration[item.starterRatio ?? ''] ?? starterHydrationPresets[item.starterType ?? ''] ?? 100) / 100
  const optionalWeight = (item.starterYeastWeight ?? 0) + getStarterEggWeight(item)
  return Math.max(0, item.weight - optionalWeight) / (1 + hydration)
}

const STARTER_EGG_UNIT_WEIGHT = 50

const getStarterEggWeight = (item: RecipeItem) => (item.starterEggCount ?? 0) * STARTER_EGG_UNIT_WEIGHT

const getStarterEggWater = (item: RecipeItem) => getStarterEggWeight(item) * 0.75

const getStarterBaseWater = (item: RecipeItem) => {
  if (typeof item.starterWater === 'number') return item.starterWater
  const optionalWeight = (item.starterYeastWeight ?? 0) + getStarterEggWeight(item)
  return Math.max(0, item.weight - optionalWeight) - getFlourContribution(item)
}

const syncStarterWeight = (item: RecipeItem) => {
  const flour = Math.max(0, getFlourContribution(item))
  const water = Math.max(0, getStarterBaseWater(item))
  item.starterFlour = flour
  item.starterWater = water
  item.hydrationPct = flour > 0 ? (water / flour) * 100 : 0
  item.weight = flour + water + (item.starterYeastWeight ?? 0) + getStarterEggWeight(item)
}

const setStarterParts = (item: RecipeItem, flour: number, water: number) => {
  item.starterFlour = Math.max(0, flour)
  item.starterWater = Math.max(0, water)
  syncStarterWeight(item)
}

const applyStarterHydrationPreset = (item: RecipeItem, hydrationPct: number) => {
  const baseWeight = Math.max(1, getFlourContribution(item) + getStarterBaseWater(item))
  const flour = baseWeight / (1 + hydrationPct / 100)
  setStarterParts(item, flour, baseWeight - flour)
}

const getWaterContribution = (item: RecipeItem) => {
  if (item.tag === 'water') return item.weight
  if (item.category === 'starter') return getStarterBaseWater(item) + getStarterEggWater(item)
  if (item.tag === 'egg') return item.weight * ((item.waterContentPct ?? 75) / 100)
  return 0
}

const getSummary = (items: RecipeItem[]) => {
  const doughWeight = items.reduce((sum, item) => sum + item.weight, 0)
  const flourWeight = items.reduce((sum, item) => sum + getFlourContribution(item), 0)
  const waterWeight = items.reduce((sum, item) => sum + getWaterContribution(item), 0)

  return {
    doughWeight,
    flourWeight,
    waterWeight,
    hydration: flourWeight ? (waterWeight / flourWeight) * 100 : 0
  }
}

const getDefaultStepTime = (type: StepType) => {
  if (type === 'fermentation') return 60
  if (type === 'baking') return 30
  if (type === 'prep' || type === 'mixing' || type === 'rest') return 20
  return 15
}

const saveItems = (items: RecipeItem[]) => {
  localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items))
}

const control = (
  name: string,
  label: string,
  value: number,
  unit: string,
  max: number,
  step: number,
  tone = ''
) => `
  <span class="control ${tone}">
    <input aria-label="${label}" autocomplete="off" autocorrect="off" data-1p-ignore="true" data-lpignore="true" inputmode="decimal" max="${max}" min="0" name="${name}" spellcheck="false" step="${step}" type="number" value="${formatInputNumber(value, step < 1 ? 1 : 0)}" />
    <span>${unit}</span>
  </span>
`

const textControl = (name: string, label: string, value: string, tone = '') => `
  <span class="control text-control ${tone}">
    <input aria-label="${label}" autocomplete="off" autocorrect="off" data-1p-ignore="true" data-lpignore="true" name="${name}" spellcheck="false" type="text" value="${escapeAttr(value)}" />
  </span>
`

const customDropdown = (
  name: string,
  label: string,
  value: string,
  options: DropdownOption[],
  tone = ''
) => {
  const activeOption = options.find((option) => option.value === value) ?? options[0]
  const menuOptions = options.filter((option) => option.value !== '')

  return `
    <div class="custom-select ${tone}" data-custom-select data-select-name="${escapeAttr(name)}" data-select-value="${escapeAttr(value)}">
      <button aria-expanded="false" aria-haspopup="listbox" aria-label="${escapeAttr(label)}" class="custom-select-button" data-custom-select-button type="button">
        <span>${escapeHtml(activeOption?.label ?? label)}</span>
        <i aria-hidden="true"></i>
      </button>
      <div class="custom-select-menu" role="listbox">
        ${menuOptions
          .map(
            (option) => `
              <button
                aria-selected="${option.value === value}"
                class="custom-select-option"
                data-select-option
                data-select-value="${escapeAttr(option.value)}"
                role="option"
                type="button"
              >
                ${escapeHtml(option.label)}
              </button>
            `
          )
          .join('')}
      </div>
    </div>
  `
}

const itemWeightControl = (item: RecipeItem) => {
  const useKg = item.weight >= 1000
  return control(
    `item:${item.id}:weight`,
    `${item.name} 重量`,
    useKg ? item.weight / 1000 : item.weight,
    useKg ? 'kg' : 'g',
    useKg ? 99 : item.tag === 'yeast' ? 999 : 9999,
    useKg ? 0.001 : item.tag === 'yeast' ? 0.1 : 1,
    `gram-control ${useKg ? 'kg-control' : ''}`
  )
}

const isWaterLinkedItem = (item: RecipeItem) =>
  item.tag === 'water' || item.tag === 'egg' || item.category === 'starter' || item.yeastType === '酵液'

const itemToneClass = (item: RecipeItem) => (isWaterLinkedItem(item) ? 'is-wet' : 'is-dry')

const itemIcon = (item: RecipeItem) => {
  if (item.category === 'starter') return '🫙'
  if (item.tag === 'flour') return '🌾'
  if (item.tag === 'water') return '💧'
  if (item.tag === 'butter') return '🧈'
  if (item.tag === 'sugar') return '🍬'
  if (item.tag === 'egg') return '🥚'
  if (item.tag === 'yeast' && item.yeastType === '酵液') return '🫧'
  if (item.tag === 'yeast' && item.yeastType === '鲜酵母') return '🧫'
  if (item.tag === 'yeast') return '✳'
  return '✨'
}

const itemExtraRow = (item: RecipeItem) => {
  if (item.category === 'starter') {
    const hasStarterYeast = typeof item.starterYeastWeight === 'number'
    const hasStarterEgg = typeof item.starterEggCount === 'number'
    return `
      <div class="item-extra starter-mini-form is-water-extra">
        <div class="starter-mini-row">
          ${customDropdown(
            `item:${item.id}:starterType`,
            '种面类型',
            item.starterType ?? '鲁邦种',
            starterOptions.map((option) => ({ value: option, label: option })),
            'inline-dropdown'
          )}
          ${customDropdown(
            `item:${item.id}:starterRatio`,
            '种面水粉比例',
            item.starterRatio ?? starterTypeDefaultRatio[item.starterType ?? '鲁邦种'] ?? '1:1',
            starterRatioOptions.map((option) => ({ value: option, label: option })),
            'ratio-dropdown'
          )}
        </div>
        <div class="starter-mini-row">
          ${control(`item:${item.id}:starterWater`, '种面水量', getStarterBaseWater(item), '水', 9999, 1, 'extra-control')}
          ${control(`item:${item.id}:starterFlour`, '种面面粉', getFlourContribution(item), '面粉', 9999, 1, 'extra-control')}
        </div>
        <div class="starter-mini-row">
          ${
            hasStarterYeast
              ? control(`item:${item.id}:starterYeastWeight`, '种面酵母', item.starterYeastWeight ?? 0, '酵', 999, 0.1, 'extra-control')
              : `<button class="mini-add-button" data-add-starter-part="${item.id}:yeast" type="button">酵母</button>`
          }
          ${
            hasStarterEgg
              ? `
                ${control(`item:${item.id}:starterEggCount`, '种面鸡蛋个数', item.starterEggCount ?? 1, '个', 24, 0.5, 'extra-control')}
                <span class="item-detail item-water-pill">50g/个 · 75% / 水 ${formatInputNumber(getStarterEggWater(item), 0)}g</span>
              `
              : `<button class="mini-add-button" data-add-starter-part="${item.id}:egg" type="button">鸡蛋</button>`
          }
        </div>
      </div>
    `
  }

  if (item.tag === 'egg') {
    return `
      <div class="item-extra is-water-extra">
        ${control(`item:${item.id}:eggCount`, '鸡蛋个数', item.eggCount ?? 1, '个', 24, 0.5, 'extra-control')}
        ${control(`item:${item.id}:eggUnitWeight`, '单个重量', item.eggUnitWeight ?? 45, 'g', 120, 1, 'extra-control')}
        <span class="item-detail item-water-pill">75% / 水 ${formatInputNumber(getWaterContribution(item), 0)}g</span>
      </div>
    `
  }

  if (item.tag === 'yeast') {
    return `
      <div class="item-extra ${item.yeastType === '酵液' ? 'is-water-extra' : ''}">
        ${customDropdown(
          `item:${item.id}:yeastType`,
          '酵母类型',
          item.yeastType ?? '干酵母',
          ['干酵母', '鲜酵母', '酵液'].map((option) => ({ value: option, label: option })),
          'inline-dropdown'
        )}
      </div>
    `
  }

  return ''
}

const itemRow = (item: RecipeItem, summary = getSummary(items)) => {
  const percent = summary.flourWeight ? (item.weight / summary.flourWeight) * 100 : 0
  const canRemove = item.category !== 'flour' || items.filter((candidate) => candidate.category === 'flour').length > 1

  return `
    <li class="recipe-item ${itemToneClass(item)}" data-item-id="${item.id}">
      <div class="item-main">
        <button aria-label="拖动 ${escapeAttr(item.name)} 排序" class="item-icon" data-item-drag-handle="${item.id}" draggable="true" type="button">${itemIcon(item)}</button>
        ${textControl(`item:${item.id}:name`, '材料名称', item.name, 'item-name-control')}
        ${control(`item:${item.id}:percent`, '百分比', percent, '%', 300, 0.5)}
        ${itemWeightControl(item)}
        <div class="item-tools">
          ${
            canRemove
              ? `<button aria-label="移除 ${escapeAttr(item.name)}" class="remove-button" data-remove-item="${item.id}" type="button"></button>`
              : '<span class="remove-spacer"></span>'
          }
        </div>
      </div>
      ${itemExtraRow(item)}
    </li>
  `
}

const categorySection = (category: ItemCategory) => {
  const summary = getSummary(items)
  const sectionItems = items.filter((item) => item.category === category)

  return `
    <section class="recipe-category" data-category="${category}">
      <div class="category-title">
        <h3>${categoryLabels[category]}</h3>
        ${
          category === 'basic'
            ? customDropdown(
                `add:${category}`,
                '添加基础材料',
                '',
                [{ value: '', label: '添加' }, ...basicOptions.map((option) => ({ value: option.tag, label: option.label }))],
                'add-dropdown'
              )
            : `<button class="add-button" data-add-category="${category}" type="button">添加</button>`
        }
      </div>
      <ul class="item-list">
        ${sectionItems.length ? sectionItems.map((item) => itemRow(item, summary)).join('') : '<li class="empty-steps">还没有材料</li>'}
      </ul>
    </section>
  `
}

let items = loadRecipeItems()
let recipeName = localStorage.getItem(RECIPE_NAME_STORAGE_KEY) ?? ''
let steps = loadSteps()
let selectedItemId = ''
let suppressNextClick = false
let openMaterialStepIds = new Set<string>()
let openNotesStepIds = new Set<string>()
let openTimerStepIds = new Set<string>()
let cookState: CookState = {
  checked: {},
  currentIndex: 0,
  now: Date.now()
}
let pointerDrag:
  | {
      dragging: boolean
      ghost?: HTMLDivElement
      itemId: string
      pointerId: number
      startX: number
      startY: number
    }
  | undefined
let itemSortDrag:
  | {
      dragging: boolean
      itemId: string
      pointerId: number
      startX: number
      startY: number
    }
  | undefined
let stepSortDrag:
  | {
      dragging: boolean
      pointerId: number
      startX: number
      startY: number
      stepId: string
    }
  | undefined

const getStepCounts = (type: StepType) => steps.filter((step) => step.type === type).length

const createStep = (type: StepType): JournalStep => {
  const nextCount = getStepCounts(type) + 1

  if (type === 'prep') {
    return {
      id: crypto.randomUUID(),
      type,
      name: '准备工作',
      itemIds: [],
      notes: nextCount === 1 ? '制作种面，或提前处理需要预混的材料。' : ''
    }
  }

  if (type === 'mixing') {
    return {
      id: crypto.randomUUID(),
      type,
      name: '打面',
      itemIds: [],
      notes:
        nextCount === 1
          ? '除了盐黄油，混合均匀，打至后膜'
          : '加入盐，黄油，打到手套膜，温度控制28.'
    }
  }

  if (type === 'fermentation') {
    return {
      id: crypto.randomUUID(),
      type,
      name: `发酵（${nextCount === 1 ? '一发' : '二发'}）`,
      itemIds: [],
      notes: '',
      temperature: 85
    }
  }

  if (type === 'baking') {
    return {
      id: crypto.randomUUID(),
      type,
      name: '烘烤',
      itemIds: [],
      notes: '',
      temperature: 350,
      temperatureUnit: 'F'
    }
  }

  return {
    id: crypto.randomUUID(),
    type,
    name: stepLabels[type],
    itemIds: [],
    notes: ''
  }
}

const getStep = (id: string) => steps.find((step) => step.id === id)!

const stepControl = (
  step: JournalStep,
  key: keyof JournalStep,
  label: string,
  value: number,
  unit: string,
  max: number,
  stepValue = 1
) => `
  <label class="mini-field ${key === 'timeValue' ? 'timer-field' : ''}">
    <span>${label}</span>
    ${control(`step:${step.id}:${String(key)}`, label, value, unit, max, stepValue, 'step-control')}
  </label>
`

const unitSelect = (step: JournalStep, key: keyof JournalStep, label: string, value: string, options: string[]) => `
  <label class="mini-field unit-field">
    <span>${label}</span>
    ${customDropdown(
      `step:${step.id}:${String(key)}`,
      label,
      value,
      options.map((option) => ({ value: option, label: option })),
      'unit-dropdown'
    )}
  </label>
`

const timeInput = (step: JournalStep) => `
  <label class="time-input">
    <span aria-hidden="true" class="timer-icon"></span>
    <input aria-label="预计耗时" inputmode="decimal" max="999" min="0" name="step:${step.id}:timeValue" step="1" type="number" value="${formatInputNumber(step.timeValue ?? 0, 0)}" />
  </label>
`

const getStepMinutes = (step: JournalStep) => {
  const value = Number(step.timeValue) || 0
  return step.timeUnit === 'hr' ? value * 60 : value
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 min'
  const rounded = Math.round(minutes)
  const hours = Math.floor(rounded / 60)
  const restMinutes = rounded % 60

  if (!hours) return `${restMinutes} min`
  if (!restMinutes) return `${hours} hr`
  return `${hours} hr ${restMinutes} min`
}

const getTotalStepMinutes = () => steps.reduce((sum, step) => sum + getStepMinutes(step), 0)

const formatClock = (time: number) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(time))

const formatElapsed = (ms: number) => formatDuration(Math.max(0, Math.round(ms / 60000)))

const stepBadge = (type: StepType, label = stepLabels[type]) => `
  <span class="step-badge">
    <span aria-hidden="true" class="step-icon" data-step-type="${type}"></span>
    <span>${label}</span>
  </span>
`

const stepTimeSummary = () => `
  <div class="step-time-summary" data-step-time-summary>
    <span>预计总耗时</span>
    <strong>${formatDuration(getTotalStepMinutes())}</strong>
  </div>
`

const ingredientChip = (item: RecipeItem, compact = false) => {
  const tagName = compact ? 'span' : 'button'
  const buttonAttrs = compact
    ? ''
    : `aria-pressed="${selectedItemId === item.id}" data-ingredient-id="${item.id}" draggable="true" type="button"`

  return `
  <${tagName}
    class="ingredient-chip ${compact ? 'in-step' : ''} ${selectedItemId === item.id ? 'is-selected' : ''}"
    data-tag="${item.tag}"
    ${buttonAttrs}
  >
    <span class="ingredient-copy">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${formatInputNumber(item.weight, item.tag === 'yeast' ? 1 : 0)}g</span>
    </span>
  </${tagName}>
`
}

const getAssignedItemIds = () => new Set(steps.flatMap((step) => step.itemIds))

const ingredientShelf = () => `
  <section class="ingredient-shelf" aria-label="可加入步骤的材料">
    <div class="shelf-head">
      <h2>材料</h2>
      <span>${selectedItemId ? '点步骤加入' : '拖到步骤里'}</span>
    </div>
    <div class="ingredient-table" data-ingredient-shelf>
      ${items
        .filter((item) => !getAssignedItemIds().has(item.id))
        .map((item) => ingredientChip(item))
        .join('') || '<span class="empty-ingredients">材料都已经放进步骤了</span>'}
    </div>
  </section>
`

const stepIngredientList = (step: JournalStep) => {
  const stepItems = step.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is RecipeItem => Boolean(item))
  const isOpen = openMaterialStepIds.has(step.id)

  if (!isOpen && !stepItems.length) return ''

  return `
    <div
      aria-label="加入 ${escapeAttr(step.name)} 的材料"
      class="step-dropzone"
      data-drop-step="${step.id}"
      role="group"
      tabindex="0"
    >
      ${
        stepItems.length
          ? `
            <div class="step-ingredients">
              ${stepItems
                .map(
                  (item) => `
                    <span class="step-ingredient-pill">
                      ${ingredientChip(item, true)}
                      <button aria-label="从 ${escapeAttr(step.name)} 移除 ${escapeAttr(item.name)}" data-remove-step-item="${step.id}:${item.id}" type="button"></button>
                    </span>
                  `
                )
                .join('')}
            </div>
          `
          : isOpen
            ? '<span class="drop-hint">把材料放到这里</span>'
            : ''
      }
    </div>
  `
}

const stepItem = (step: JournalStep) => {
  const temperatureStep = step.type === 'fermentation' || step.type === 'baking'
  const showTimer = openTimerStepIds.has(step.id)
  const showNotes = openNotesStepIds.has(step.id)
  const hasMaterials = step.itemIds.length > 0
  const hasTimer = typeof step.timeValue === 'number' && step.timeValue > 0
  const hasNotes = step.notes.trim().length > 0

  return `
    <li class="step-item is-step-${step.type}" data-step-id="${step.id}" draggable="true">
      <div class="step-main">
        ${stepBadge(step.type)}
        ${textControl(`step:${step.id}:name`, '步骤名称', step.name, 'step-name-control')}
        <div class="step-tools">
          <button aria-label="显示 ${escapeAttr(step.name)} 的材料区" aria-pressed="${openMaterialStepIds.has(step.id)}" class="${hasMaterials ? 'has-content' : ''}" data-step-tool="materials:${step.id}" type="button"><span aria-hidden="true">🥣</span></button>
          <button aria-label="设置 ${escapeAttr(step.name)} 的预计耗时" aria-pressed="${showTimer}" class="${hasTimer ? 'has-content' : ''}" data-step-tool="timer:${step.id}" type="button"><span aria-hidden="true">⏱️</span></button>
          <button aria-label="编辑 ${escapeAttr(step.name)} 的备注" aria-pressed="${showNotes}" class="${hasNotes ? 'has-content' : ''}" data-step-tool="notes:${step.id}" type="button"><span aria-hidden="true">📝</span></button>
        </div>
      </div>

      ${stepIngredientList(step)}

      ${
        showTimer
          ? `
            <div class="step-fields ${temperatureStep ? 'has-temperature' : ''} ${step.type === 'baking' ? 'baking-fields' : ''}">
              ${timeInput(step)}
              ${unitSelect(step, 'timeUnit', '单位', step.timeUnit ?? 'min', ['min', 'hr'])}
              ${
                temperatureStep
                  ? `
                    ${stepControl(step, 'temperature', '温度', step.temperature ?? 0, '', 600, 1)}
                    ${
                      step.type === 'baking'
                        ? unitSelect(step, 'temperatureUnit', '温标', step.temperatureUnit ?? 'F', ['F', 'C'])
                        : ''
                    }
                  `
                  : ''
              }
            </div>
          `
          : ''
      }

      ${
        showNotes
          ? `
            <label class="notes-field">
              <span>备注</span>
              <textarea aria-label="备注" name="step:${step.id}:notes" placeholder="备注" rows="1">${escapeHtml(step.notes)}</textarea>
            </label>
          `
          : ''
      }
    </li>
  `
}

const renderSteps = () => {
  const shelf = document.querySelector<HTMLElement>('[data-process-top]')
  if (shelf) shelf.innerHTML = ingredientShelf()

  const list = document.querySelector<HTMLUListElement>('[data-steps-list]')!
  const total = document.querySelector<HTMLElement>('[data-step-total]')
  if (total) total.innerHTML = stepTimeSummary()

  list.innerHTML = steps.length
    ? steps.map((step) => stepItem(step)).join('')
    : '<li class="empty-steps">选择一个步骤开始记录；材料会从上方拖进每一步。</li>'

  if (document.querySelector<HTMLElement>('.app-shell')?.dataset.activePage === 'cook') renderCook()
}

const getCurrentCookStep = () => steps[Math.min(cookState.currentIndex, Math.max(steps.length - 1, 0))]

const getStepCookItems = (step: JournalStep) =>
  step.itemIds.map((id) => items.find((item) => item.id === id)).filter((item): item is RecipeItem => Boolean(item))

const isCookItemChecked = (stepId: string, itemId: string) => (cookState.checked[stepId] ?? []).includes(itemId)

const cookItemButton = (step: JournalStep, item: RecipeItem) => {
  const checked = isCookItemChecked(step.id, item.id)

  return `
    <button aria-pressed="${checked}" class="cook-item ${checked ? 'is-checked' : ''}" data-cook-check="${step.id}:${item.id}" type="button">
      <span>${escapeHtml(item.name)}</span>
      <strong>${formatInputNumber(item.weight, item.tag === 'yeast' ? 1 : 0)}g</strong>
    </button>
  `
}

const cookTimer = (step: JournalStep) => {
  const estimateMs = getStepMinutes(step) * 60000
  const estimateAt = cookState.now + estimateMs
  const isRunning = cookState.timerStepId === step.id && cookState.timerEndsAt
  const remainingMs = isRunning ? Math.max(0, (cookState.timerEndsAt ?? 0) - cookState.now) : estimateMs

  return `
    <section class="cook-timer">
      <div>
        <span>当前</span>
        <strong>${formatClock(cookState.now)}</strong>
      </div>
      <button class="${isRunning ? 'is-running' : ''}" data-cook-timer="${step.id}" type="button">
        <span aria-hidden="true" class="timer-icon"></span>
        <span>${isRunning ? formatElapsed(remainingMs) : '开始倒计时'}</span>
      </button>
      <div>
        <span>预计完成</span>
        <strong>${formatClock(isRunning ? (cookState.timerEndsAt ?? estimateAt) : estimateAt)}</strong>
      </div>
    </section>
  `
}

const cookSummary = () => {
  const totalSpent = cookState.completedAt && cookState.totalStartedAt ? cookState.completedAt - cookState.totalStartedAt : 0
  const totalItems = steps.reduce((sum, step) => sum + getStepCookItems(step).length, 0)
  const checkedItems = steps.reduce((sum, step) => sum + (cookState.checked[step.id] ?? []).length, 0)

  return `
    <section class="panel cook-summary">
      <div class="cook-summary-head">
        <span aria-hidden="true" class="step-icon" data-step-type="baking"></span>
        <div>
          <p>制作完成</p>
          <h2>吐司配方</h2>
        </div>
      </div>
      <div class="cook-summary-grid">
        <div><span>实际耗时</span><strong>${formatElapsed(totalSpent)}</strong></div>
        <div><span>预计耗时</span><strong>${formatDuration(getTotalStepMinutes())}</strong></div>
        <div><span>完成步骤</span><strong>${steps.length}/${steps.length}</strong></div>
        <div><span>材料确认</span><strong>${checkedItems}/${totalItems}</strong></div>
      </div>
      <button class="cook-primary" data-cook-reset type="button">再做一次</button>
    </section>
  `
}

const cookEmpty = () => `
  <section class="panel cook-panel">
    <div class="empty-steps">先在第二页添加制作步骤，再开始制作。</div>
  </section>
`

const cookCurrentStep = () => {
  if (!steps.length) return cookEmpty()
  if (cookState.completedAt) return cookSummary()

  if (cookState.currentIndex >= steps.length) cookState.currentIndex = Math.max(steps.length - 1, 0)
  const step = getCurrentCookStep()
  const stepItems = getStepCookItems(step)
  const checkedCount = (cookState.checked[step.id] ?? []).length

  return `
    <section class="panel cook-panel">
      <div class="cook-progress">
        <span>步骤 ${cookState.currentIndex + 1}/${steps.length}</span>
        <strong>${formatDuration(getStepMinutes(step))}</strong>
      </div>

      <div class="cook-current">
        ${stepBadge(step.type)}
        <h2>${escapeHtml(step.name)}</h2>
        ${step.temperature ? `<span class="cook-temp">${formatInputNumber(step.temperature, 0)}${step.temperatureUnit ?? 'F'}</span>` : ''}
      </div>

      ${cookTimer(step)}

      <div class="cook-checklist" aria-label="本步骤材料 checklist">
        ${
          stepItems.length
            ? stepItems.map((item) => cookItemButton(step, item)).join('')
            : '<span class="empty-ingredients">这个步骤没有指定材料</span>'
        }
      </div>

      <label class="cook-notes">
        <span>操作</span>
        <textarea readonly rows="3">${escapeHtml(step.notes || '按你的记录完成这个步骤。')}</textarea>
      </label>

      <div class="cook-actions">
        <button data-cook-prev type="button" ${cookState.currentIndex === 0 ? 'disabled' : ''}>上一步</button>
        <span>${checkedCount}/${stepItems.length} 材料</span>
        <button class="cook-primary" data-cook-next type="button">${cookState.currentIndex === steps.length - 1 ? '完成' : '下一步'}</button>
      </div>
    </section>
  `
}

const renderCook = () => {
  const cookRoot = document.querySelector<HTMLElement>('[data-cook-root]')
  if (!cookRoot) return
  cookRoot.innerHTML = cookCurrentStep()
}

const summaryMetrics = () => {
  const summary = getSummary(items)
  return `
    <div class="summary-grid">
      <div>
        <span>面团总重量</span>
        <strong data-summary="doughWeight">${formatWeight(summary.doughWeight)}</strong>
      </div>
      <div>
        <span>面粉总重量</span>
        <strong data-summary="flourWeight">${formatWeight(summary.flourWeight)}</strong>
      </div>
      <div>
        <span>含水量</span>
        <strong data-summary="hydration">${formatInputNumber(summary.hydration, 1)}%</strong>
      </div>
    </div>
  `
}

const summaryCard = () => {
  return `
    <section class="panel summary-panel">
      <div class="recipe-meta-row">
        <label class="recipe-name-field">
          <span aria-hidden="true">📝</span>
          ${textControl('recipe:name', '配方名称', recipeName, 'recipe-name-control')}
        </label>
        ${customDropdown(
          'template:load',
          '加载模板',
          '',
          [
            { value: '', label: 'Load template' },
            { value: 'toast', label: '吐司' }
          ],
          'template-dropdown'
        )}
      </div>
      ${summaryMetrics()}
      <button class="preview-open summary-preview" data-preview-open type="button">Preview</button>
    </section>
  `
}

const previewItem = (item: RecipeItem) => {
  const detail =
    item.category === 'starter'
      ? `<small>面粉 ${formatInputNumber(getFlourContribution(item), 0)}g / 水 ${formatInputNumber(getWaterContribution(item), 0)}g</small>`
      : item.tag === 'egg'
        ? `<small>${formatInputNumber(item.eggCount ?? 1, 1)} 个 / 水 ${formatInputNumber(getWaterContribution(item), 0)}g</small>`
        : item.tag === 'yeast' && item.yeastType
          ? `<small>${escapeHtml(item.yeastType)}</small>`
          : ''

  return `
    <li class="${itemToneClass(item)}">
      <span>
        <strong>${escapeHtml(item.name)}</strong>
        ${detail}
      </span>
      <b>${formatWeight(item.weight, item.tag === 'yeast' ? 1 : 0)}</b>
    </li>
  `
}

const previewCategory = (category: ItemCategory) => {
  const sectionItems = items.filter((item) => item.category === category)
  if (!sectionItems.length) return ''

  return `
    <section class="preview-section">
      <h3>${categoryLabels[category]}</h3>
      <ul>${sectionItems.map((item) => previewItem(item)).join('')}</ul>
    </section>
  `
}

const previewModal = () => {
  return `
    <div class="preview-backdrop" data-preview-backdrop>
      <section aria-label="配方预览" aria-modal="true" class="preview-card" role="dialog">
        <div class="preview-head">
          <div>
            <p>Baking Journal</p>
            <h2>吐司配方</h2>
          </div>
          <button aria-label="关闭预览" data-preview-close type="button"></button>
        </div>
        ${summaryMetrics().replaceAll('data-summary=', 'data-preview-summary=')}
        <div class="preview-sections">
          ${previewCategory('flour')}
          ${previewCategory('starter')}
          ${previewCategory('basic')}
          ${previewCategory('other')}
        </div>
      </section>
    </div>
  `
}

const renderPreview = (open: boolean) => {
  const previewRoot = document.querySelector<HTMLElement>('[data-preview-root]')!
  previewRoot.innerHTML = open ? previewModal() : ''
}

const updateSummary = () => {
  const summary = getSummary(items)
  document.querySelector<HTMLElement>('[data-summary="doughWeight"]')!.textContent =
    formatWeight(summary.doughWeight)
  document.querySelector<HTMLElement>('[data-summary="flourWeight"]')!.textContent =
    formatWeight(summary.flourWeight)
  document.querySelector<HTMLElement>('[data-summary="hydration"]')!.textContent =
    `${formatInputNumber(summary.hydration, 1)}%`
}

const renderRecipe = () => {
  const recipeRoot = document.querySelector<HTMLElement>('[data-recipe-root]')!
  recipeRoot.innerHTML = `
    ${summaryCard()}
    <section class="panel formula-panel">
      <div class="panel-title">
        <h2>配方</h2>
        <span>静态计算</span>
      </div>
      ${categorySection('flour')}
      ${categorySection('starter')}
      ${categorySection('basic')}
      ${categorySection('other')}
    </section>
  `
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="app-shell" data-active-page="formula">
    <header class="app-header">
      <p>Baking Journal</p>
      <h1>吐司配方</h1>
    </header>

    <nav class="page-tabs" aria-label="配方编辑步骤">
      <button aria-pressed="true" data-page-button="formula" type="button">1 配方</button>
      <button aria-pressed="false" data-page-button="steps" type="button">2 制作</button>
      <button aria-pressed="false" data-page-button="cook" type="button">3 开始</button>
    </nav>

    <form class="recipe-form" aria-label="吐司配方换算">
      <section class="page-view is-active" data-page="formula">
        <div class="recipe-root" data-recipe-root></div>
      </section>

      <section class="page-view" data-page="steps">
        <div data-process-top></div>

        <section class="panel steps-panel">
          <div class="panel-title">
            <h2>制作步骤</h2>
            <span>添加</span>
          </div>

          <label class="step-picker">
            <span>步骤类型</span>
            ${customDropdown(
              'stepType',
              '添加步骤类型',
              '',
              [
                { value: '', label: '选择步骤' },
                { value: 'prep', label: '准备工作' },
                { value: 'mixing', label: '打面' },
                { value: 'fermentation', label: '发酵' },
                { value: 'rest', label: '松弛' },
                { value: 'shaping', label: '整形' },
                { value: 'baking', label: '烘烤' }
              ],
              'step-dropdown'
            )}
          </label>

          <div data-step-total></div>

          <ul class="steps-list" data-steps-list></ul>
        </section>
      </section>

      <section class="page-view" data-page="cook">
        <div data-cook-root></div>
      </section>
    </form>
    <div data-preview-root></div>
  </main>
`

renderRecipe()
renderSteps()

const form = document.querySelector<HTMLFormElement>('.recipe-form')!
const appShell = document.querySelector<HTMLElement>('.app-shell')!

const setActivePage = (page: ActivePage) => {
  appShell.dataset.activePage = page
  document.querySelectorAll<HTMLElement>('[data-page]').forEach((view) => {
    view.classList.toggle('is-active', view.dataset.page === page)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-page-button]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.pageButton === page))
  })
  if (page === 'cook') renderCook()
}

const addItemToStep = (stepId: string, itemId: string) => {
  const step = getStep(stepId)
  steps = steps.map((candidate) =>
    candidate.id === stepId ? candidate : { ...candidate, itemIds: candidate.itemIds.filter((id) => id !== itemId) }
  )

  if (!step.itemIds.includes(itemId)) {
    step.itemIds = [...step.itemIds, itemId]
  }
  saveSteps(steps)
  selectedItemId = ''
  renderSteps()
}

const moveDragGhost = (event: PointerEvent) => {
  if (!pointerDrag?.ghost) return

  pointerDrag.ghost.style.transform = `translate(${event.clientX + 10}px, ${event.clientY + 10}px)`
}

const clearPointerDrag = () => {
  pointerDrag?.ghost?.remove()
  pointerDrag = undefined
}

const clearItemSortDrag = () => {
  document.querySelectorAll('.recipe-item.is-sorting, .recipe-item.is-drop-target').forEach((node) => {
    node.classList.remove('is-sorting', 'is-drop-target')
  })
  itemSortDrag = undefined
}

const clearStepSortDrag = () => {
  document.querySelectorAll('.step-item.is-sorting, .step-item.is-drop-target').forEach((node) => {
    node.classList.remove('is-sorting', 'is-drop-target')
  })
  stepSortDrag = undefined
}

const reorderRecipeItem = (sourceId: string, targetId: string, after = false) => {
  if (sourceId === targetId) return false
  const source = items.find((item) => item.id === sourceId)
  const target = items.find((item) => item.id === targetId)
  if (!source || !target || source.category !== target.category) return false

  const nextItems = items.filter((item) => item.id !== sourceId)
  const targetIndex = nextItems.findIndex((item) => item.id === targetId)
  if (targetIndex < 0) return false

  nextItems.splice(targetIndex + (after ? 1 : 0), 0, source)
  items = nextItems
  saveItems(items)
  renderRecipe()
  renderSteps()
  return true
}

const reorderStep = (sourceId: string, targetId: string, after = false) => {
  if (sourceId === targetId) return false
  const source = steps.find((step) => step.id === sourceId)
  if (!source || !steps.some((step) => step.id === targetId)) return false

  const nextSteps = steps.filter((step) => step.id !== sourceId)
  const targetIndex = nextSteps.findIndex((step) => step.id === targetId)
  if (targetIndex < 0) return false

  nextSteps.splice(targetIndex + (after ? 1 : 0), 0, source)
  steps = nextSteps
  saveSteps(steps)
  renderSteps()
  return true
}

const ensureCookStarted = () => {
  const now = Date.now()
  if (!cookState.totalStartedAt) cookState.totalStartedAt = now
  if (!cookState.stepStartedAt) cookState.stepStartedAt = now
}

const resetCookState = () => {
  cookState = {
    checked: {},
    currentIndex: 0,
    now: Date.now()
  }
  renderCook()
}

const toggleCookItem = (stepId: string, itemId: string) => {
  ensureCookStarted()
  const checked = new Set(cookState.checked[stepId] ?? [])
  if (checked.has(itemId)) {
    checked.delete(itemId)
  } else {
    checked.add(itemId)
  }
  cookState.checked = { ...cookState.checked, [stepId]: [...checked] }
  renderCook()
}

const startCookTimer = (stepId: string) => {
  ensureCookStarted()
  const step = steps.find((candidate) => candidate.id === stepId)
  if (!step) return
  const now = Date.now()
  cookState = {
    ...cookState,
    now,
    timerEndsAt: now + getStepMinutes(step) * 60000,
    timerStepId: stepId
  }
  renderCook()
}

const moveCookStep = (direction: 1 | -1) => {
  ensureCookStarted()
  const nextIndex = cookState.currentIndex + direction
  if (nextIndex < 0) return

  if (nextIndex >= steps.length) {
    cookState.completedAt = Date.now()
    cookState.now = cookState.completedAt
    renderCook()
    return
  }

  cookState = {
    ...cookState,
    currentIndex: nextIndex,
    stepStartedAt: Date.now(),
    timerEndsAt: undefined,
    timerStepId: undefined
  }
  renderCook()
}

const toggleStepSet = (set: Set<string>, stepId: string) => {
  const next = new Set(set)
  if (next.has(stepId)) {
    next.delete(stepId)
  } else {
    next.add(stepId)
  }
  return next
}

const toggleStepTool = (tool: string, stepId: string) => {
  const step = steps.find((candidate) => candidate.id === stepId)
  if (!step) return

  if (tool === 'materials') {
    openMaterialStepIds = toggleStepSet(openMaterialStepIds, stepId)
  }

  if (tool === 'timer') {
    if (!step.timeValue) {
      step.timeValue = getDefaultStepTime(step.type)
      step.timeUnit = 'min'
      saveSteps(steps)
    }
    openTimerStepIds = toggleStepSet(openTimerStepIds, stepId)
  }

  if (tool === 'notes') {
    openNotesStepIds = toggleStepSet(openNotesStepIds, stepId)
  }

  renderSteps()
}

const closeDropdowns = (except?: HTMLElement) => {
  document.querySelectorAll<HTMLElement>('[data-custom-select].is-open').forEach((dropdown) => {
    if (dropdown === except) return
    dropdown.classList.remove('is-open')
    dropdown.querySelector<HTMLButtonElement>('[data-custom-select-button]')?.setAttribute('aria-expanded', 'false')
  })
}

const toggleDropdown = (dropdown: HTMLElement) => {
  const isOpen = dropdown.classList.contains('is-open')
  closeDropdowns(dropdown)
  dropdown.classList.toggle('is-open', !isOpen)
  dropdown.querySelector<HTMLButtonElement>('[data-custom-select-button]')?.setAttribute('aria-expanded', String(!isOpen))
}

const applyDropdownValue = (name: string, value: string) => {
  if (name === 'template:load') {
    return
  }

  if (name.startsWith('add:')) {
    if (!value) return
    const [, category] = name.split(':')
    items = [...items, createItem(category as ItemCategory, value as ItemTag)]
    saveItems(items)
    renderRecipe()
    renderSteps()
    return
  }

  if (name.startsWith('item:')) {
    const [, id, key] = name.split(':')
    const item = items.find((candidate) => candidate.id === id)
    if (!item) return

    if (key === 'starterType') {
      item.starterType = value
      item.name = value
      item.starterRatio = starterTypeDefaultRatio[value] ?? '1:1'
      applyStarterHydrationPreset(item, starterRatioHydration[item.starterRatio] ?? 100)
    }

    if (key === 'starterRatio') {
      item.starterRatio = value
      applyStarterHydrationPreset(item, starterRatioHydration[value] ?? 100)
    }

    if (key === 'yeastType') {
      item.yeastType = value
      item.name = value
    }

    saveItems(items)
    renderRecipe()
    renderSteps()
    return
  }

  if (name === 'stepType') {
    if (!value) return
    steps = [...steps, createStep(value as StepType)]
    saveSteps(steps)
    renderSteps()
    setActivePage('steps')
    return
  }

  if (name.startsWith('step:')) {
    const [, id, key] = name.split(':')
    const step = getStep(id)

    if (key === 'timeUnit') step.timeUnit = value as JournalStep['timeUnit']
    if (key === 'temperatureUnit') step.temperatureUnit = value as JournalStep['temperatureUnit']
    saveSteps(steps)
    document.querySelector<HTMLElement>('[data-step-total]')!.innerHTML = stepTimeSummary()
  }
}

form.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement

  if (target.name === 'recipe:name') {
    recipeName = target.value
    localStorage.setItem(RECIPE_NAME_STORAGE_KEY, recipeName)
    return
  }

  if (target.name.startsWith('item:')) {
    const [, id, key] = target.name.split(':')
    const item = items.find((candidate) => candidate.id === id)
    if (!item) return

    if (key === 'name') {
      item.name = target.value
      saveItems(items)
      renderSteps()
      return
    }

    if (key === 'weight') {
      const unit = target.closest<HTMLElement>('.control')?.querySelector('span')?.textContent?.trim()
      const nextWeight = unit === 'kg' ? (Number(target.value) || 0) * 1000 : Number(target.value) || 0
      const unitChanged = (item.weight >= 1000) !== (nextWeight >= 1000)

      if (item.category === 'starter') {
        const optionalWeight = (item.starterYeastWeight ?? 0) + getStarterEggWeight(item)
        const currentBase = Math.max(1, getFlourContribution(item) + getStarterBaseWater(item))
        const nextBase = Math.max(0, nextWeight - optionalWeight)
        const scale = nextBase / currentBase
        setStarterParts(item, getFlourContribution(item) * scale, getStarterBaseWater(item) * scale)
      } else {
        item.weight = nextWeight
      }

      if (unitChanged) {
        saveItems(items)
        renderRecipe()
        renderSteps()
        return
      }
    }

    if (key === 'percent') {
      const nextWeight = getSummary(items).flourWeight * ((Number(target.value) || 0) / 100)
      if (item.category === 'starter') {
        const optionalWeight = (item.starterYeastWeight ?? 0) + getStarterEggWeight(item)
        const currentBase = Math.max(1, getFlourContribution(item) + getStarterBaseWater(item))
        const nextBase = Math.max(0, nextWeight - optionalWeight)
        const scale = nextBase / currentBase
        setStarterParts(item, getFlourContribution(item) * scale, getStarterBaseWater(item) * scale)
      } else {
        item.weight = nextWeight
      }
    }

    if (key === 'starterWater' || key === 'starterFlour') {
      const flour = key === 'starterFlour' ? Number(target.value) || 0 : getFlourContribution(item)
      const water = key === 'starterWater' ? Number(target.value) || 0 : getStarterBaseWater(item)
      setStarterParts(item, flour, water)
    }

    if (key === 'starterYeastWeight') {
      item.starterYeastWeight = Number(target.value) || 0
      syncStarterWeight(item)
    }

    if (key === 'starterEggCount') {
      if (key === 'starterEggCount') item.starterEggCount = Number(target.value) || 0
      syncStarterWeight(item)
    }

    if (key === 'hydrationPct') {
      item.hydrationPct = Number(target.value) || 0
    }

    if (key === 'waterContentPct') {
      item.waterContentPct = Number(target.value) || 0
    }

    if (key === 'eggCount' || key === 'eggUnitWeight') {
      if (key === 'eggCount') item.eggCount = Number(target.value) || 0
      if (key === 'eggUnitWeight') item.eggUnitWeight = Number(target.value) || 0
      item.weight = (item.eggCount ?? 0) * (item.eggUnitWeight ?? 45)
    }

    saveItems(items)
    updateSummary()
    renderSteps()
    return
  }

  if (target.name.startsWith('step:')) {
    const [, id, key] = target.name.split(':')
    const step = getStep(id)
    const value = target.value

    if (key === 'name' || key === 'notes') {
      step[key] = value
    } else if (key === 'timeValue' || key === 'temperature') {
      step[key] = Number(value) || 0
    }

    saveSteps(steps)
    document.querySelector<HTMLElement>('[data-step-total]')!.innerHTML = stepTimeSummary()
    return
  }

})

form.addEventListener('keydown', (event) => {
  const target = event.target as HTMLInputElement
  if (event.key !== 'Backspace' || !target.name?.startsWith('item:')) return

  const [, id, key] = target.name.split(':')
  if (key !== 'weight') return

  const item = items.find((candidate) => candidate.id === id)
  const unit = target.closest<HTMLElement>('.control')?.querySelector('span')?.textContent?.trim()
  if (!item || unit !== 'kg') return

  const value = target.value
  const cursorAtEnd =
    target.selectionStart === null ||
    (target.selectionStart === value.length && target.selectionEnd === value.length)
  if (!cursorAtEnd) return

  event.preventDefault()
  const displayWeight = (Number(value) || item.weight / 1000) * 1000
  const gramDigits = String(Math.round(displayWeight))
  const nextWeight = Number(gramDigits.slice(0, -1)) || 0
  item.weight = nextWeight
  saveItems(items)
  renderRecipe()
  renderSteps()
})

form.addEventListener('change', (event) => {
  const target = event.target as HTMLSelectElement

  if (target.name.startsWith('add:') && target.value) {
    const [, category] = target.name.split(':')
    items = [...items, createItem(category as ItemCategory, target.value as ItemTag)]
    saveItems(items)
    renderRecipe()
    renderSteps()
    return
  }

  if (target.name.startsWith('item:')) {
    const [, id, key] = target.name.split(':')
    const item = items.find((candidate) => candidate.id === id)
    if (!item) return

    if (key === 'yeastType') {
      item.yeastType = target.value
      item.name = target.value
    }

    saveItems(items)
    renderRecipe()
    renderSteps()
    return
  }

  if (target.name === 'stepType' && target.value) {
    steps = [...steps, createStep(target.value as StepType)]
    saveSteps(steps)
    renderSteps()
    setActivePage('steps')
    target.value = ''
    return
  }

  if (target.name.startsWith('step:')) {
    const [, id, key] = target.name.split(':')
    const step = getStep(id)

    if (key === 'timeUnit' || key === 'temperatureUnit') {
      if (key === 'timeUnit') step.timeUnit = target.value as JournalStep['timeUnit']
      if (key === 'temperatureUnit') {
        step.temperatureUnit = target.value as JournalStep['temperatureUnit']
      }
      saveSteps(steps)
    }
  }
})

appShell.addEventListener('click', (event) => {
  const target = event.target as HTMLElement

  if (suppressNextClick) {
    suppressNextClick = false
    return
  }

  if (target.closest<HTMLElement>('[data-preview-open]')) {
    closeDropdowns()
    renderPreview(true)
    return
  }

  if (target.closest<HTMLElement>('[data-preview-close]') || target.dataset.previewBackdrop !== undefined) {
    renderPreview(false)
    return
  }

  const selectOption = target.closest<HTMLElement>('[data-select-option]')
  if (selectOption) {
    const dropdown = selectOption.closest<HTMLElement>('[data-custom-select]')
    const name = dropdown?.dataset.selectName
    const value = selectOption.dataset.selectValue ?? ''
    closeDropdowns()
    if (name) applyDropdownValue(name, value)
    return
  }

  const selectButton = target.closest<HTMLElement>('[data-custom-select-button]')
  if (selectButton) {
    const dropdown = selectButton.closest<HTMLElement>('[data-custom-select]')
    if (dropdown) toggleDropdown(dropdown)
    return
  }

  closeDropdowns()

  const category = target.dataset.addCategory as ItemCategory | undefined
  const removeId = target.dataset.removeItem
  const page = target.dataset.pageButton as ActivePage | undefined
  const ingredientId = target.closest<HTMLElement>('[data-ingredient-id]')?.dataset.ingredientId
  const dropStepId = target.closest<HTMLElement>('[data-drop-step]')?.dataset.dropStep
  const removeStepItem = target.dataset.removeStepItem
  const cookCheck = target.closest<HTMLElement>('[data-cook-check]')?.dataset.cookCheck
  const cookTimerTarget = target.closest<HTMLElement>('[data-cook-timer]')?.dataset.cookTimer
  const stepTool = target.closest<HTMLElement>('[data-step-tool]')?.dataset.stepTool
  const starterPart = target.dataset.addStarterPart

  if (page) {
    setActivePage(page)
    return
  }

  if (stepTool) {
    const [tool, stepId] = stepTool.split(':')
    toggleStepTool(tool, stepId)
    return
  }

  if (cookCheck) {
    const [stepId, itemId] = cookCheck.split(':')
    toggleCookItem(stepId, itemId)
    return
  }

  if (cookTimerTarget) {
    startCookTimer(cookTimerTarget)
    return
  }

  if (target.closest<HTMLElement>('[data-cook-prev]')) {
    moveCookStep(-1)
    return
  }

  if (target.closest<HTMLElement>('[data-cook-next]')) {
    moveCookStep(1)
    return
  }

  if (target.closest<HTMLElement>('[data-cook-reset]')) {
    resetCookState()
    return
  }

  if (starterPart) {
    const [itemId, part] = starterPart.split(':')
    const item = items.find((candidate) => candidate.id === itemId)
    if (!item) return

    if (part === 'yeast') item.starterYeastWeight = 1
    if (part === 'egg') {
      item.starterEggCount = 1
      item.starterEggUnitWeight = STARTER_EGG_UNIT_WEIGHT
    }

    syncStarterWeight(item)
    saveItems(items)
    renderRecipe()
    renderSteps()
    return
  }

  if (removeStepItem) {
    const [stepId, itemId] = removeStepItem.split(':')
    const step = getStep(stepId)
    step.itemIds = step.itemIds.filter((id) => id !== itemId)
    saveSteps(steps)
    renderSteps()
    return
  }

  if (ingredientId) {
    selectedItemId = selectedItemId === ingredientId ? '' : ingredientId
    renderSteps()
    return
  }

  if (dropStepId && selectedItemId) {
    addItemToStep(dropStepId, selectedItemId)
    return
  }

  if (removeId) {
    items = items.filter((item) => item.id !== removeId)
    steps = steps.map((step) => ({ ...step, itemIds: step.itemIds.filter((id) => id !== removeId) }))
    saveItems(items)
    saveSteps(steps)
    renderRecipe()
    renderSteps()
    return
  }

  if (!category) return

  items = [...items, createItem(category)]
  saveItems(items)
  renderRecipe()
  renderSteps()
})

form.addEventListener('dragstart', (event) => {
  const target = event.target as HTMLElement
  const stepRow = target.closest<HTMLElement>('[data-step-id]')
  if (stepRow && !target.closest('input, textarea, button, [data-custom-select]')) {
    event.dataTransfer?.setData('text/plain', `step:${stepRow.dataset.stepId ?? ''}`)
    event.dataTransfer?.setDragImage(stepRow, 18, 18)
    return
  }

  const itemHandle = target.closest<HTMLElement>('[data-item-drag-handle]')
  if (itemHandle) {
    event.dataTransfer?.setData('text/plain', `recipe-item:${itemHandle.dataset.itemDragHandle ?? ''}`)
    event.dataTransfer?.setDragImage(itemHandle, 18, 18)
    return
  }

  const ingredient = target.closest<HTMLElement>('[data-ingredient-id]')
  if (!ingredient) return

  event.dataTransfer?.setData('text/plain', ingredient.dataset.ingredientId ?? '')
  event.dataTransfer?.setDragImage(ingredient, 28, 28)
})

form.addEventListener('dragover', (event) => {
  const stepRow = (event.target as HTMLElement).closest<HTMLElement>('[data-step-id]')
  if (stepRow && event.dataTransfer?.types.includes('text/plain')) {
    event.preventDefault()
    stepRow.classList.add('is-drop-target')
    return
  }

  const recipeRow = (event.target as HTMLElement).closest<HTMLElement>('[data-item-id]')
  if (recipeRow && event.dataTransfer?.types.includes('text/plain')) {
    event.preventDefault()
    recipeRow.classList.add('is-drop-target')
    return
  }

  const dropzone = (event.target as HTMLElement).closest<HTMLElement>('[data-drop-step]')
  if (!dropzone) return

  event.preventDefault()
  dropzone.classList.add('is-over')
})

form.addEventListener('dragleave', (event) => {
  const stepRow = (event.target as HTMLElement).closest<HTMLElement>('[data-step-id]')
  if (stepRow) stepRow.classList.remove('is-drop-target')

  const recipeRow = (event.target as HTMLElement).closest<HTMLElement>('[data-item-id]')
  if (recipeRow) recipeRow.classList.remove('is-drop-target')

  const dropzone = (event.target as HTMLElement).closest<HTMLElement>('[data-drop-step]')
  if (!dropzone) return

  dropzone.classList.remove('is-over')
})

form.addEventListener('drop', (event) => {
  const stepRow = (event.target as HTMLElement).closest<HTMLElement>('[data-step-id]')
  const recipeRow = (event.target as HTMLElement).closest<HTMLElement>('[data-item-id]')
  const droppedText = event.dataTransfer?.getData('text/plain') ?? ''
  if (stepRow && droppedText.startsWith('step:')) {
    event.preventDefault()
    const rect = stepRow.getBoundingClientRect()
    reorderStep(droppedText.replace('step:', ''), stepRow.dataset.stepId ?? '', event.clientY > rect.top + rect.height / 2)
    return
  }

  if (stepRow && droppedText && !droppedText.startsWith('recipe-item:')) {
    event.preventDefault()
    stepRow.classList.remove('is-drop-target')
    addItemToStep(stepRow.dataset.stepId ?? '', droppedText)
    return
  }

  if (recipeRow && droppedText.startsWith('recipe-item:')) {
    event.preventDefault()
    const rect = recipeRow.getBoundingClientRect()
    reorderRecipeItem(droppedText.replace('recipe-item:', ''), recipeRow.dataset.itemId ?? '', event.clientY > rect.top + rect.height / 2)
    return
  }

  const dropzone = (event.target as HTMLElement).closest<HTMLElement>('[data-drop-step]')
  if (!dropzone) return

  event.preventDefault()
  dropzone.classList.remove('is-over')
  const itemId = droppedText
  if (itemId) addItemToStep(dropzone.dataset.dropStep ?? '', itemId)
})

form.addEventListener('pointerdown', (event) => {
  const target = event.target as HTMLElement
  const stepRow = target.closest<HTMLElement>('[data-step-id]')
  if (stepRow && event.isPrimary && !target.closest('input, textarea, button, [data-custom-select]')) {
    stepSortDrag = {
      dragging: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      stepId: stepRow.dataset.stepId ?? ''
    }
    return
  }

  const itemHandle = target.closest<HTMLElement>('[data-item-drag-handle]')
  if (itemHandle && event.isPrimary) {
    itemSortDrag = {
      dragging: false,
      itemId: itemHandle.dataset.itemDragHandle ?? '',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    }
    return
  }

  const ingredient = target.closest<HTMLElement>('[data-ingredient-id]')
  if (!ingredient || !event.isPrimary) return

  pointerDrag = {
    dragging: false,
    itemId: ingredient.dataset.ingredientId ?? '',
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY
  }
})

form.addEventListener('pointermove', (event) => {
  if (stepSortDrag && stepSortDrag.pointerId === event.pointerId) {
    const distance = Math.hypot(event.clientX - stepSortDrag.startX, event.clientY - stepSortDrag.startY)
    if (!stepSortDrag.dragging && distance < 8) return

    stepSortDrag.dragging = true
    event.preventDefault()
    document.querySelector<HTMLElement>(`[data-step-id="${CSS.escape(stepSortDrag.stepId)}"]`)?.classList.add('is-sorting')
    document.querySelectorAll('.step-item.is-drop-target').forEach((node) => node.classList.remove('is-drop-target'))
    document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-step-id]')?.classList.add('is-drop-target')
    return
  }

  if (itemSortDrag && itemSortDrag.pointerId === event.pointerId) {
    const distance = Math.hypot(event.clientX - itemSortDrag.startX, event.clientY - itemSortDrag.startY)
    if (!itemSortDrag.dragging && distance < 8) return

    itemSortDrag.dragging = true
    event.preventDefault()
    document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(itemSortDrag.itemId)}"]`)?.classList.add('is-sorting')
    document.querySelectorAll('.recipe-item.is-drop-target').forEach((node) => node.classList.remove('is-drop-target'))
    document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-item-id]')?.classList.add('is-drop-target')
    return
  }

  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return

  const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY)
  if (!pointerDrag.dragging && distance < 10) return

  if (!pointerDrag.dragging) {
    const item = items.find((candidate) => candidate.id === pointerDrag?.itemId)
    if (!item) {
      clearPointerDrag()
      return
    }

    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.innerHTML = ingredientChip(item, true)
    document.body.append(ghost)
    pointerDrag.ghost = ghost
    pointerDrag.dragging = true
  }

  event.preventDefault()
  moveDragGhost(event)
})

form.addEventListener('pointerup', (event) => {
  if (stepSortDrag && stepSortDrag.pointerId === event.pointerId) {
    if (stepSortDrag.dragging) {
      const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-step-id]')
      if (targetRow) {
        const rect = targetRow.getBoundingClientRect()
        reorderStep(stepSortDrag.stepId, targetRow.dataset.stepId ?? '', event.clientY > rect.top + rect.height / 2)
      }
      suppressNextClick = true
    }
    clearStepSortDrag()
    return
  }

  if (itemSortDrag && itemSortDrag.pointerId === event.pointerId) {
    if (itemSortDrag.dragging) {
      const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-item-id]')
      if (targetRow) {
        const rect = targetRow.getBoundingClientRect()
        reorderRecipeItem(itemSortDrag.itemId, targetRow.dataset.itemId ?? '', event.clientY > rect.top + rect.height / 2)
      }
      suppressNextClick = true
    }
    clearItemSortDrag()
    return
  }

  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return

  if (pointerDrag.dragging) {
    const dropTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-drop-step], [data-step-id]')
    const stepId = dropTarget?.dataset.dropStep ?? dropTarget?.dataset.stepId
    if (stepId) addItemToStep(stepId, pointerDrag.itemId)
    suppressNextClick = true
  }

  clearPointerDrag()
})

form.addEventListener('pointercancel', () => {
  clearPointerDrag()
  clearItemSortDrag()
  clearStepSortDrag()
})

appShell.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement

  if (event.key === 'Escape') {
    closeDropdowns()
    renderPreview(false)
    return
  }

  const selectButton = target.closest<HTMLElement>('[data-custom-select-button]')
  if (selectButton && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
    event.preventDefault()
    const dropdown = selectButton.closest<HTMLElement>('[data-custom-select]')
    if (dropdown) toggleDropdown(dropdown)
    return
  }

  if (event.key !== 'Enter' && event.key !== ' ') return

  const dropzone = target.closest<HTMLElement>('[data-drop-step]')
  if (!dropzone || !selectedItemId) return

  event.preventDefault()
  addItemToStep(dropzone.dataset.dropStep ?? '', selectedItemId)
})

document.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('[data-custom-select]')) return
  closeDropdowns()
})

window.setInterval(() => {
  if (appShell.dataset.activePage !== 'cook' || cookState.completedAt) return
  cookState.now = Date.now()
  renderCook()
}, 1000)
