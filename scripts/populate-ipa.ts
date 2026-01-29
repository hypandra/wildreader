import fs from 'fs'

const hardestWords = [
  "apocalypse", "catechism", "deuteronomy", "ecclesiastical", "eucharist", "hallelujah", "hymn", "omniscient", "psalm", "sacrilegious",
  "betwixt", "bourgeois", "draught", "faux pas", "hors d'oeuvre", "rendezvous", "schadenfreude", "thou", "victuals", "yonder",
  "aura", "bet", "cap", "cook", "drip", "ghost", "glaze", "rizz", "stan", "sus",
  "affidavit", "arraignment", "criminology", "forensic", "incarceration", "jurisdiction", "litigation", "recidivism", "subpoena", "surveillance",
  "anesthesiologist", "arrhythmia", "asphyxiation", "defibrillator", "esophagus", "hemorrhage", "otolaryngology", "pharmaceutical", "pneumonia", "schizophrenia"
]

async function fetchIPA(word: string): Promise<{ ipa: string[], hasMoreVariants: boolean, sourceUrl: string } | null> {
  try {
    // Get sections to find English and Pronunciation
    const sectionsUrl = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=sections&format=json&origin=*`
    const sectionsRes = await fetch(sectionsUrl)
    const sectionsData = await sectionsRes.json()

    // Find English section
    const englishSection = sectionsData.parse?.sections?.find((s: any) => s.line === 'English')
    if (!englishSection) return null

    // Find Pronunciation subsection
    const pronunciationSection = sectionsData.parse.sections.find((s: any) =>
      s.line === 'Pronunciation' && s.number.startsWith(englishSection.number + '.')
    )

    if (!pronunciationSection) return null

    // Get wikitext for pronunciation section using index
    const wikitextUrl = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&section=${pronunciationSection.index}&format=json&origin=*`
    const wikitextRes = await fetch(wikitextUrl)
    const wikitextData = await wikitextRes.json()

    const wikitext = wikitextData.parse?.wikitext?.['*'] || ''

    // Extract IPA from templates and patterns
    const ipaFromTemplates = wikitext.match(/\{\{IPA\|en\|([^}]+)\}\}/g) || []
    const ipas = ipaFromTemplates.flatMap((match: string) => {
      const content = match.match(/\{\{IPA\|en\|([^}]+)\}\}/)?.[1] || ''
      return content.split('|').filter((s: string) => s.startsWith('/') && s.endsWith('/'))
    })

    // Also look for IPA-like patterns
    const additionalPatterns = wikitext.match(/\/([^\/\s]+)\//g) || []
    const additionalIpas = additionalPatterns.map((m: string) => m.slice(1, -1))

    // Combine and deduplicate, ensure proper format
    const allIpas = [...new Set([...ipas, ...additionalIpas])].filter((ipa: string) => ipa.startsWith('/') && ipa.endsWith('/'))

    if (allIpas.length === 0) return null

    // Prioritize US variants (assume first few are US, then UK, etc.)
    const top3 = allIpas.slice(0, 3)
    const hasMore = allIpas.length > 3

    return {
      ipa: top3,
      hasMoreVariants: hasMore,
      sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`
    }
  } catch (e) {
    console.error(`Error fetching IPA for ${word}:`, e)
    return null
  }
}

async function main() {
  const results: any[] = []

  for (const word of hardestWords) {
    console.log(`Processing ${word}...`)
    const data = await fetchIPA(word)
    if (data) {
      results.push({
        word,
        lang: 'en',
        ...data,
        source: 'wiktionary'
      })
    } else {
      console.log(`Skipping ${word} - no IPA found`)
    }
    // Be polite to Wiktionary API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  fs.mkdirSync('data', { recursive: true })
  fs.writeFileSync('data/ipa-data.json', JSON.stringify(results, null, 2))
  console.log(`Done! Processed ${results.length} words with IPA data.`)
}

main().catch(console.error)