// Shared ResumeDocument (schema_version 1) fixture for JSON-mode tests.

const resumeDocumentFixture = () => ({
  resume: {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    executive_summary: "Seasoned developer.",
    location: "New York, NY",
    github_url: "https://github.com/janedoe",
    mobile_number: "+1 555",
    profile_image_url: "https://example.com/p.jpg",
  },
  education: [
    {
      id: 1,
      resume_id: 1,
      education_stage: "BS",
      institution_name: "State University",
      degree: "Computer Science",
      start_date: "2020-09",
      end_date: "2024-05",
      description: "Studied systems.",
      display_order: 1,
      active: true,
    },
  ],
  education_key_points: {
    1: [
      {
        id: 1,
        education_id: 1,
        key_point: "Graduated with honors",
        display_order: 1,
        active: true,
      },
    ],
  },
  skills: [
    {
      id: 1,
      resume_id: 1,
      skill_name: "Rust",
      confidence_percentage: 90,
      display_order: 1,
    },
  ],
  work_experiences: [
    {
      id: 1,
      resume_id: 1,
      job_title: "Engineer",
      company_name: "Acme",
      start_date: "2020-01",
      end_date: null,
      description: "Built services.",
      display_order: 1,
      active: true,
    },
  ],
  work_experience_key_points: {
    1: [
      {
        id: 1,
        work_experience_id: 1,
        key_point: "Led the team",
        display_order: 1,
        active: true,
      },
    ],
  },
  portfolio_projects: [
    {
      id: 1,
      resume_id: 1,
      project_name: "Resume Engine",
      image_url: "",
      project_link: "https://example.com",
      source_code_link: "https://github.com/janedoe/proj",
      description: "Demo project",
      display_order: 1,
      active: true,
      video_url: null,
    },
    {
      id: 2,
      resume_id: 1,
      project_name: "Second Project",
      image_url: "",
      project_link: "https://example.org",
      source_code_link: "https://github.com/janedoe/proj2",
      description: "Another demo",
      display_order: 2,
      active: true,
      video_url: null,
    },
  ],
  portfolio_key_points: {
    1: [
      {
        id: 1,
        portfolio_project_id: 1,
        key_point: "Shipped v1",
        display_order: 1,
        active: true,
      },
    ],
  },
  portfolio_technologies: {
    1: [
      {
        id: 1,
        portfolio_project_id: 1,
        technology_name: "Rust",
        display_order: 1,
        active: true,
      },
    ],
  },
  languages: [
    { id: 1, resume_id: 1, language_name: "Rust", display_order: 1 },
  ],
  frameworks: {
    1: [
      {
        id: 1,
        language_id: 1,
        framework_name: "Rocket",
        display_order: 1,
      },
    ],
  },
});

const setFullPageHtml = () => {
  document.body.innerHTML = `
    <div id="jsonErrorBanner" class="hidden print:hidden"></div>
    <div id="profilePlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    <h1 id="profileName"></h1>
    <img id="profileImage" />
    <span id="profileLocationPart1"></span>
    <span id="profileLocationPart2"></span>
    <a id="profileEmailLink"><span id="profileEmailText1"></span><span id="profileEmailText2"></span></a>
    <a id="profileGithubLink"><span id="profileGithubText"></span></a>
    <span id="profileMobile"></span>
    <ul id="skillsList" class="relative">
      <div id="skillsPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </ul>
    <div id="languagesContainer" class="relative">
      <div id="languagesPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <h1 id="professionalSummaryHeading" class="text-2xl">Professional Summary</h1>
    <div id="professionalSummaryContainer" class="relative">
      <div id="professionalSummaryPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <h1 id="educationHeading">Education</h1>
    <div id="educationContainer" class="relative">
      <div id="educationPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <div id="experienceContainer" class="relative">
      <div id="experiencePlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <button id="projectsViewToggle" type="button">Show Static List</button>
    <button id="projectsCarouselPrev" type="button">Prev</button>
    <button id="projectsCarouselNext" type="button">Next</button>
    <div id="projectsContainer" class="relative">
      <div id="projectsPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
      <div id="projectsCarousel" class="projects-carousel">
        <div class="projects-carousel-viewport">
          <div class="projects-carousel-track"></div>
        </div>
      </div>
    </div>
  `;
};

export { resumeDocumentFixture, setFullPageHtml };
