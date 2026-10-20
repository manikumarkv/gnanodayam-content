import { collection, config, fields } from '@keystatic/core'

/**
 * Keystatic config for "Know more" docs (gnanodayam ADR 0008). Each entry is one content doc,
 * saved as `content/know-more/<key>.json`; the app fetches it from `/api/know-more/<key>`.
 * Blocks mirror the app's content schema (`lib/content.schema.ts`) — see `lib/to-content-doc.ts`.
 *
 * Storage: local files in development, the GitHub repo everywhere else. Interns save to
 * `content/…` branches and open a pull request; only `main` is live.
 */

/** Trust fields carried by every estimated figure. */
const sourced = {
  source: fields.text({
    label: 'Source',
    description: 'Where the figure comes from. Required for any estimate.',
  }),
  date: fields.text({ label: 'As-of date', description: 'e.g. 2025–26 or 2026-06' }),
  verified: fields.checkbox({
    label: 'Checked by a person',
    description: 'Leave off for AI-drafted or unchecked figures — they show an "approximate" badge.',
    defaultValue: false,
  }),
}

const categorical = fields.object({
  categories: fields.array(fields.text({ label: 'Category' }), {
    label: 'Categories (x-axis)',
    itemLabel: (p) => p.value || 'Category',
  }),
  series: fields.array(
    fields.object({
      label: fields.text({ label: 'Series name' }),
      values: fields.array(fields.number({ label: 'Value' }), {
        label: 'Values (one per category, in order)',
      }),
    }),
    { label: 'Series', itemLabel: (p) => p.fields.label.value || 'Series' },
  ),
})

const proportional = fields.object({
  slices: fields.array(
    fields.object({
      label: fields.text({ label: 'Label' }),
      value: fields.number({ label: 'Value' }),
    }),
    { label: 'Slices', itemLabel: (p) => p.fields.label.value || 'Slice' },
  ),
})

const blocks = fields.blocks(
  {
    text: {
      label: 'Text',
      itemLabel: (p) => p.fields.body.value.slice(0, 60) || 'Text',
      schema: fields.object({ body: fields.text({ label: 'Body', multiline: true }) }),
    },
    facts: {
      label: 'Facts',
      itemLabel: (p) => p.fields.title.value || 'Facts',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            value: fields.text({ label: 'Value', validation: { isRequired: true } }),
            note: fields.text({ label: 'Note' }),
            ...sourced,
          }),
          { label: 'Rows', itemLabel: (p) => p.fields.label.value || 'Row' },
        ),
      }),
    },
    callout: {
      label: 'Callout',
      itemLabel: (p) => p.fields.title.value || 'Callout',
      schema: fields.object({
        tone: fields.select({
          label: 'Tone',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warn' },
            { label: 'Note', value: 'note' },
          ],
          defaultValue: 'info',
        }),
        title: fields.text({ label: 'Title' }),
        body: fields.text({ label: 'Body', multiline: true }),
      }),
    },
    list: {
      label: 'List',
      itemLabel: (p) => p.fields.title.value || 'List',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(fields.text({ label: 'Item', multiline: true }), {
          label: 'Items',
          itemLabel: (p) => p.value.slice(0, 60) || 'Item',
        }),
      }),
    },
    links: {
      label: 'Links',
      itemLabel: (p) => p.fields.title.value || 'Links',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            href: fields.text({
              label: 'Link',
              description: 'An internal page on gnanodayam.com, e.g. /roles/data-analyst',
              validation: {
                isRequired: true,
                pattern: { regex: /^\//, message: 'Must start with / (internal links only)' },
              },
            }),
          }),
          { label: 'Links', itemLabel: (p) => p.fields.label.value || 'Link' },
        ),
      }),
    },
    image: {
      label: 'Image',
      itemLabel: (p) => p.fields.alt.value || 'Image',
      schema: fields.object({
        src: fields.image({
          label: 'Image',
          directory: 'public/know-more',
          publicPath: '/know-more/',
          validation: { isRequired: true },
        }),
        alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
        caption: fields.text({ label: 'Caption' }),
        credit: fields.text({ label: 'Credit' }),
      }),
    },
    chart: {
      label: 'Chart',
      itemLabel: (p) => p.fields.title.value || 'Chart',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        unit: fields.text({ label: 'Unit', description: 'e.g. ₹L, %, lakh' }),
        data: fields.conditional(
          fields.select({
            label: 'Chart type',
            options: [
              { label: 'Line', value: 'line' },
              { label: 'Bar', value: 'bar' },
              { label: 'Area', value: 'area' },
              { label: 'Pie', value: 'pie' },
              { label: 'Donut', value: 'donut' },
            ],
            defaultValue: 'bar',
          }),
          {
            line: categorical,
            bar: categorical,
            area: categorical,
            pie: proportional,
            donut: proportional,
          },
        ),
        note: fields.text({ label: 'Note' }),
        ...sourced,
      }),
    },
  },
  { label: 'Blocks' },
)

export default config({
  storage:
    process.env.NODE_ENV === 'development' || process.env.KEYSTATIC_STORAGE === 'local'
      ? { kind: 'local' }
      : {
          kind: 'github',
          repo: { owner: 'manikumarkv', name: 'gnanodayam-content' },
          branchPrefix: 'content/',
        },
  ui: { brand: { name: 'Gnanodayam content' } },
  collections: {
    knowMore: collection({
      label: 'Know more',
      slugField: 'title',
      path: 'content/know-more/*',
      format: { data: 'json' },
      columns: ['title', 'status'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: {
            label: 'Key',
            description:
              'The details key the app uses (e.g. btech). Set the same key on the path node or role in /admin. Don’t change it once in use.',
          },
        }),
        kicker: fields.text({ label: 'Kicker', description: 'Short line under the title' }),
        status: fields.select({
          label: 'Status',
          description: 'Drafts are never served to the app.',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
        }),
        blocks,
        lastReviewed: fields.text({ label: 'Last reviewed', description: 'e.g. 2026-06' }),
        createdBy: fields.object(
          {
            kind: fields.select({
              label: 'Written by',
              options: [
                { label: 'A person', value: 'human' },
                { label: 'AI', value: 'ai' },
              ],
              defaultValue: 'human',
            }),
            name: fields.text({ label: 'Name' }),
            at: fields.text({ label: 'When', description: 'e.g. 2026-06' }),
          },
          { label: 'Created by' },
        ),
        verifiedBy: fields.object(
          {
            name: fields.text({ label: 'Name', description: 'Leave empty until a person reviews it' }),
            at: fields.text({ label: 'When' }),
          },
          { label: 'Reviewed by' },
        ),
      },
    }),
  },
})
