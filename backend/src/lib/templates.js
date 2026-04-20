const supabase = require('../utils/database');

async function getCurrentTemplate(brandId) {
  const { data, error } = await supabase
    .from('qa_form_templates')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_current', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getFormForBrand(brandId) {
  const template = await getCurrentTemplate(brandId);
  if (!template) return null;

  const { data: sections, error: sErr } = await supabase
    .from('qa_form_sections')
    .select('*')
    .eq('template_id', template.id)
    .order('sort_order', { ascending: true });
  if (sErr) throw sErr;

  const sectionIds = sections.map((s) => s.id);
  const { data: points, error: pErr } = sectionIds.length
    ? await supabase
        .from('qa_form_points')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order', { ascending: true })
    : { data: [], error: null };
  if (pErr) throw pErr;

  const pointsBySection = new Map();
  for (const p of points) {
    if (!pointsBySection.has(p.section_id)) pointsBySection.set(p.section_id, []);
    pointsBySection.get(p.section_id).push(p);
  }

  return {
    template,
    sections: sections.map((s) => ({ ...s, points: pointsBySection.get(s.id) || [] })),
  };
}

module.exports = { getCurrentTemplate, getFormForBrand };
