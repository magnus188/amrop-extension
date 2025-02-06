import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { 
  getAboutSection,
  getProfileName,
  scrapeExperiences 
} from '../../scripts/scraper.js'; 

const normalizeText = text => text.trim().replace(/\s+/g, ' ');


describe('Scrape long linked in profile', () => {
  let document;

  beforeAll(() => {
    // Use new URL to get the absolute file path
    const fixtureUrl = new URL('./fixtures/long.html', import.meta.url);
    // `fixtureUrl.pathname` is the absolute path to long.html on disk
    const html = fs.readFileSync(fixtureUrl.pathname, 'utf8');
    const dom = new JSDOM(html);

    global.document = dom.window.document;
    document = dom.window.document;
  });


  it('should scrape the profile name', () => {
    const name = getProfileName();
    expect(name).toBe('Jarle Trandokken');
  });

  it('should scrape the about section', () => {
    const about = getAboutSection();
    expect(about).toBe("N/A");
  });

  it('should scrape experiences', () => {
    const experiences = scrapeExperiences();
    expect(experiences.length).toBe(13);

    const normalizedExperiences = experiences.map(exp => ({
      jobTitle: normalizeText(exp.jobTitle),
      company: normalizeText(exp.company),
      duration: normalizeText(exp.duration),
      location: normalizeText(exp.location)
    }));

    console.log(normalizedExperiences);
    expect(normalizedExperiences).toEqual(
      [
        {
          jobTitle: "Managing Partner",
          company: "Amrop Norge",
          duration: "sep. 2023 - Nå · 1 år 6måneder",
          location: "Oslo, Norway"
        },
        {
          jobTitle: "Partner",
          company: "Amrop Norge",
          duration: "feb. 2014 - okt. 2023 · 9 år 9måneder",
          location: "Oslo Area, Norway"
        },
        {
          jobTitle: "Senior Consultant",
          company: "Amrop Norge",
          duration: "aug. 2013 - feb. 2014 · 7 måneder",
          location: "Oslo Area, Norway"
        },
        {
          jobTitle: "Global Board Member",
          company: "Amrop",
          duration: "mai 2020 - jun. 2022 · 2 år 2måneder",
          location: "Oslo, Norway"
        },
        {
          jobTitle: "Chairman Of The Board",
          company: "Porter AS (Porterbuddy)",
          duration: "sep. 2016 - feb. 2020 · 3 år 6måneder",
          location: "Oslo, Norway"
        },
        {
          jobTitle: "Vice President Supply Chain (Supply & Trade)",
          company: "Yara International ASA",
          duration: "jan. 2012 - jul. 2013 · 1 år 7måneder",
          location: "N/A"
        },
        {
          jobTitle: "Vice President Central Procurement (Upstream)",
          company: "Yara International ASA",
          duration: "jan. 2011 - jan. 2012 · 1 år 1mnd",
          location: "N/A"
        },
        {
          jobTitle: "Partner, Manging Director",
          company: "BearingPoint Norway AS",
          duration: "aug. 2008 - des. 2010 · 2 år 5måneder",
          location: "N/A"
        },
        {
          jobTitle: "CEO / Adm.Dir",
          company: "CityMail Denmark AS",
          duration: "jan. 2006 - aug. 2008 · 2 år 8måneder",
          location: "N/A"
        },
        {
          jobTitle: "COO and CIO",
          company: "CityMail Denmark AS",
          duration: "nov. 2002 - jan. 2006 · 3 år 3måneder",
          location: "N/A"
        },
        {
          jobTitle: "Director",
          company: "BearingPoint",
          duration: "1997 - 2002 · 5 år",
          location: "N/A"
        },
        {
          jobTitle: "Senior Consultant",
          company: "Accenture",
          duration: "1993 - 1997 · 4 år",
          location: "N/A"
        },
        {
          jobTitle: "Market Analyst",
          company: "Hewlett-Packard, California",
          duration: "1992 - 1992 · Mindre enn et år",
          location: "N/A"
        }
      ]
    );
  });
});