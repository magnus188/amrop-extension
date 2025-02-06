import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { 
  getAboutSection,
  getProfileName,
  scrapeExperiences 
} from '../../scripts/scraper.js'; 

const normalizeText = text => text.trim().replace(/\s+/g, ' ');

describe('Scrape short linked in profile', () => {
  let document;

  beforeAll(() => {
    // Use new URL to get the absolute file path
    const fixtureUrl = new URL('./fixtures/short.html', import.meta.url);
    // `fixtureUrl.pathname` is the absolute path to long.html on disk
    const html = fs.readFileSync(fixtureUrl.pathname, 'utf8');
    const dom = new JSDOM(html);

    global.document = dom.window.document;
    document = dom.window.document;
  });


  it('should scrape the profile name', () => {
    const name = getProfileName();
    expect(name).toBe('Malene Camilla Wergeland Fjeller');
  });

  it('should scrape the about section', () => {
    const about = getAboutSection();
    expect(about).toBe("Hello this is my about section");
  });

  it('should scrape experiences', () => {
    const experiences = scrapeExperiences();
    expect(experiences.length).toBe(6);
    
    const normalizedExperiences = experiences.map(exp => ({
      jobTitle: normalizeText(exp.jobTitle),
      company: normalizeText(exp.company),
      duration: normalizeText(exp.duration),
      location: normalizeText(exp.location)
    }));

    expect(normalizedExperiences).toEqual([
      {
        jobTitle: "Senior Recruiter",
        company: "McKinsey & Company",
        duration: "mar. 2022 - Nå · 3 år",
        location: "Oslo, Norway"
      },
      {
        jobTitle: "Research Manager/Team leader",
        company: "Amrop Norge",
        duration: "aug. 2021 - mar. 2022 · 8 måneder",
        location: "Oslo, Oslo, Norge"
      },
      {
        jobTitle: "Research Associate",
        company: "Amrop Norge",
        duration: "aug. 2020 - mar. 2022 · 1 år 8måneder",
        location: "Oslo, Norway"
      },
      {
        jobTitle: "Senior Human Resources Advisor",
        company: "The Norwegian Ministry of Finance",
        duration: "nov. 2018 - aug. 2020 · 1 år 10måneder",
        location: "Oslo"
      },
      {
        jobTitle: "Human Resources Advisor",
        company: "The Norwegian Ministry of Finance",
        duration: "des. 2015 - nov. 2018 · 3 år",
        location: "N/A"
      },
      {
        jobTitle: "Human Resources Consultant",
        company: "The Norwegian Ministry of Finance",
        duration: "nov. 2013 - des. 2015 · 2 år 2måneder",
        location: "Oslo Area, Norway"
      }
    ]);
  });
});
