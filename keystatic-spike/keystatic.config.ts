import { collection, config, fields } from '@keystatic/core'

const source = {
  source: fields.text({ label: 'Source' }),
  date: fields.text({ label: 'As-of date' }),
  verified: fields.checkbox({ label: 'Verified by a human', defaultValue: false }),
}

const blocks = fields.blocks(
  {
    text: {
      label: 'Text',
      schema: fields.object({ body: fields.text({ label: 'Body', multiline: true }) }),
    },
    facts: {
      label: 'Facts',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            value: fields.text({ label: 'Value', validation: { isRequired: true } }),
            note: fields.text({ label: 'Note' }),
            ...source,
          }),
          { label: 'Rows', itemLabel: (p) => p.fields.label.value || 'Row' },
        ),
      }),
    },
    callout: {
      label: 'Callout',
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
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(fields.text({ label: 'Item' }), {
          label: 'Items',
          itemLabel: (p) => p.value || 'Item',
        }),
      }),
    },
    links: {
      label: 'Links',
      schema: fields.object({
        title: fields.text({ label: 'Title' }),
        items: fields.array(
          fields.object({
            label: fields.text({ label: 'Label' }),
            href: fields.text({
              label: 'Link (internal, starts with /)',
              validation: { pattern: { regex: /^\//, message: 'Must start with /' } },
            }),
          }),
          { label: 'Links', itemLabel: (p) => p.fields.label.value || 'Link' },
        ),
      }),
    },
    image: {
      label: 'Image',
      schema: fields.object({
        src: fields.image({ label: 'Image', directory: 'public/know-more', publicPath: '/know-more/' }),
        alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
        caption: fields.text({ label: 'Caption' }),
        credit: fields.text({ label: 'Credit' }),
      }),
    },
    chart: {
      label: 'Chart',
      schema: fields.object({
        chartType: fields.select({
          label: 'Chart type',
          options: ['line', 'bar', 'area', 'pie', 'donut'].map((v) => ({ label: v, value: v })),
          defaultValue: 'bar',
        }),
        title: fields.text({ label: 'Title' }),
        unit: fields.text({ label: 'Unit (e.g. ₹L, %)' }),
        categories: fields.array(fields.text({ label: 'Category' }), {
          label: 'Categories (line / bar / area)',
          itemLabel: (p) => p.value || 'Category',
        }),
        series: fields.array(
          fields.object({
            label: fields.text({ label: 'Series name' }),
            values: fields.array(fields.number({ label: 'Value' }), { label: 'Values' }),
          }),
          { label: 'Series (line / bar / area)', itemLabel: (p) => p.fields.label.value || 'Series' },
        ),
        slices: fields.array(
          fields.object({ label: fields.text({ label: 'Label' }), value: fields.number({ label: 'Value' }) }),
          { label: 'Slices (pie / donut)', itemLabel: (p) => p.fields.label.value || 'Slice' },
        ),
        note: fields.text({ label: 'Note' }),
        ...source,
      }),
    },
  },
  { label: 'Blocks' },
)

export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? { kind: 'github', repo: 'manikumarkv/gnanodayam-content' }
      : { kind: 'local' },
  collections: {
    knowMore: collection({
      label: 'Know more',
      slugField: 'key',
      path: 'content/know-more/*',
      format: { data: 'json' },
      schema: {
        key: fields.slug({ name: { label: 'Key (e.g. btech)' } }),
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        kicker: fields.text({ label: 'Kicker' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
        }),
        blocks,
        lastReviewed: fields.text({ label: 'Last reviewed (YYYY-MM)' }),
        createdBy: fields.object(
          {
            kind: fields.select({
              label: 'Kind',
              options: [
                { label: 'AI', value: 'ai' },
                { label: 'Human', value: 'human' },
              ],
              defaultValue: 'human',
            }),
            name: fields.text({ label: 'Name' }),
            at: fields.text({ label: 'When' }),
          },
          { label: 'Created by' },
        ),
        verifiedBy: fields.object(
          { name: fields.text({ label: 'Name' }), at: fields.text({ label: 'When' }) },
          { label: 'Verified by (leave empty if not reviewed)' },
        ),
      },
    }),
  },
})
