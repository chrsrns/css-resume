import { describe, expect, it } from "vitest";
import { renderResumeDocument } from "../js/json-mode.js";
import {
  renderEducation,
  renderExperience,
  renderLanguages,
  renderProfile,
  renderProjects,
  renderSkills,
  renderSummary,
} from "../js/renderers.js";
import {
  resumeDocumentFixture,
  setFullPageHtml,
} from "./fixtures/resumeDocument.js";

const sectionSnapshot = () => ({
  title: document.title,
  profileName: document.getElementById("profileName").textContent,
  profileLocation:
    document.getElementById("profileLocationPart1").textContent +
    document.getElementById("profileLocationPart2").textContent,
  profileEmail: document.getElementById("profileEmailLink").textContent,
  profileGithub: document.getElementById("profileGithubText").textContent,
  profileMobile: document.getElementById("profileMobile").textContent,
  skills: document.getElementById("skillsList").innerHTML,
  languages: document.getElementById("languagesContainer").innerHTML,
  summary: document.getElementById("professionalSummaryContainer").innerHTML,
  education: document.getElementById("educationContainer").innerHTML,
  experience: document.getElementById("experienceContainer").innerHTML,
  projects: document.getElementById("projectsContainer").innerHTML,
});

describe("JSON mode render parity", () => {
  it("produces identical section content to the API-mode render path", () => {
    const doc = resumeDocumentFixture();

    setFullPageHtml();
    renderResumeDocument(doc);
    const jsonMode = sectionSnapshot();

    setFullPageHtml();
    renderProfile(doc.resume);
    renderSummary(doc.resume.executive_summary);
    renderEducation(doc.education, doc.education_key_points);
    renderExperience(doc.work_experiences, doc.work_experience_key_points);
    renderSkills(doc.skills);
    renderProjects(
      doc.portfolio_projects,
      doc.portfolio_key_points,
      doc.portfolio_technologies,
    );
    renderLanguages(doc.languages, doc.frameworks);
    const apiMode = sectionSnapshot();

    expect(jsonMode).toEqual(apiMode);
  });
});
