import { getConfig } from "./config.js";
import { createWebSocketWithReconnect } from "./websocket.js";
import { destroyProjectsCarousel, initProjectsCarousel, initProjectsToggle } from "./carousel.js";
import { clearEl, el, reAddSectionPlaceholder, renderEducation, renderExperience, renderLanguages, renderProfile, renderProjects, renderSkills, renderSummary } from "./renderers.js";

////////////////////////////////////////////////////////
// WebSocket Connection Helpers
////////////////////////////////////////////////////////

const handleResumeChange = (event) => {
  console.log(`Resume ${event.resume_id} changed:`, event.action);
  const { apiBaseUrl, resumeId } = getConfig();

  // Check if action is valid
  // For the purposes of this function, we only care about the 'updated' property
  if (event.action === null || typeof event.action !== 'object' || !('updated' in event.action)) {
    return;
  }

  switch (event.action.updated) {
    case 'personalinfo':
    case 'summary':
      refreshProfile(apiBaseUrl, resumeId);
      break;
    case 'education':
      refreshEducation(apiBaseUrl, resumeId);
      break;
    case 'frameworks':
      refreshFrameworks(apiBaseUrl, resumeId);
      break;
    case 'languages':
      refreshLanguages(apiBaseUrl, resumeId);
      break;
    case 'projects':
      refreshPortfolioProjects(apiBaseUrl, resumeId);
      break;
    case 'skills':
      refreshSkills(apiBaseUrl, resumeId);
      break;
    case 'experience':
      refreshWorkExperiences(apiBaseUrl, resumeId);
      break;
  }
};

const handleWebSocketMessage = (event) => {
  try {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'resume.changed':
        handleResumeChange(message);
        break;
      case 'error':
        console.error('WebSocket error:', message.message);
        break;
      default:
        console.log('Unknown message type:', message);
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};



////////////////////////////////////////////////////////
// API Access Helpers
////////////////////////////////////////////////////////

const buildUrl = (apiBaseUrl, path) => {
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const fetchBody = async (apiBaseUrl, path) => {
  const url = buildUrl(apiBaseUrl, path);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      if (data && typeof data.body === "string") msg = data.body;
    } catch {
      // ignore
    }
    throw new Error(`${res.status}: ${msg}`);
  }

  const data = await res.json();
  return data.body;
};

////////////////////////////////////////////////////////
// Main Initialization
////////////////////////////////////////////////////////

const refreshProfile = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("profilePlaceholderOverlay");
  reAddSectionPlaceholder(container);

  const summaryContainer = document.getElementById("professionalSummaryContainer");
  if (summaryContainer) {
    reAddSectionPlaceholder(summaryContainer);
    const summarySection = document.getElementById("professionalSummarySection");
    if (summarySection) summarySection.classList.remove("hidden");
  }

  fetchBody(apiBaseUrl, `/resume/${resumeId}`).then((resume) => {
    renderProfile(resume);
    renderSummary(resume?.executive_summary);
  });
};

const refreshSkills = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("skillsList");
  reAddSectionPlaceholder(container);
  fetchBody(apiBaseUrl, `/resume/${resumeId}/skills`).then((skills) => {
    renderSkills(skills);
  });
};

const refreshEducation = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("educationContainer");
  reAddSectionPlaceholder(container);
  fetchBody(apiBaseUrl, `/resume/${resumeId}/education`).then(async (educations) => {
    const educationKeyPointsPairs = await Promise.all(
      (educations || []).map(async (ed) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/education/${ed.id}/key_points`);
          return [ed.id, items || []];
        } catch {
          return [ed.id, []];
        }
      })
    );
    const educationKeyPointsById = Object.fromEntries(educationKeyPointsPairs);
    renderEducation(educations, educationKeyPointsById);
  });
};

const refreshWorkExperiences = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("experienceContainer");
  reAddSectionPlaceholder(container);
  fetchBody(apiBaseUrl, `/resume/${resumeId}/work_experiences`).then(async (work) => {
    const workKeyPointsPairs = await Promise.all(
      (work || []).map(async (w) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/work_experiences/${w.id}/key_points`);
          return [w.id, items || []];
        } catch {
          return [w.id, []];
        }
      })
    );
    const workKeyPointsById = Object.fromEntries(workKeyPointsPairs);
    renderExperience(work, workKeyPointsById);
  });
};

const refreshPortfolioProjects = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("projectsContainer");
  reAddSectionPlaceholder(container);
  fetchBody(apiBaseUrl, `/resume/${resumeId}/portfolio_projects`).then(async (projects) => {
    const projectKeyPointsPairs = await Promise.all(
      (projects || []).map(async (p) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/portfolio_projects/${p.id}/key_points`);
          return [p.id, items || []];
        } catch {
          return [p.id, []];
        }
      })
    );

    const projectTechPairs = await Promise.all(
      (projects || []).map(async (p) => {
        try {
          const items = await fetchBody(
            apiBaseUrl,
            `/resume/${resumeId}/portfolio_projects/${p.id}/technologies`
          );
          return [p.id, items || []];
        } catch {
          return [p.id, []];
        }
      })
    );

    const projectKeyPointsById = Object.fromEntries(projectKeyPointsPairs);
    const projectTechById = Object.fromEntries(projectTechPairs);
    // V55: destroy old Embla instance before re-rendering
    destroyProjectsCarousel();
    const result = renderProjects(projects, projectKeyPointsById, projectTechById);
    initProjectsCarousel(result?.projectCount || 0);
  });
};

const refreshLanguages = async (apiBaseUrl, resumeId) => {
  const container = document.getElementById("languagesContainer");
  reAddSectionPlaceholder(container);
  fetchBody(apiBaseUrl, `/resume/${resumeId}/languages`).then(async (languages) => {
    const frameworkPairs = await Promise.all(
      (languages || []).map(async (lang) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/languages/${lang.id}/frameworks`);
          return [lang.id, items || []];
        } catch {
          return [lang.id, []];
        }
      })
    );
    const frameworksByLanguageId = Object.fromEntries(frameworkPairs);
    renderLanguages(languages, frameworksByLanguageId);
  });
};

////////////////////////////////////////////////////////
// Welcome Dialog
////////////////////////////////////////////////////////

const initWelcomeDialog = () => {
  const dialog = document.getElementById('welcomeDialog');
  const backdrop = document.getElementById('dialogBackdrop');
  const closeBtn = document.getElementById('dialogCloseBtn');
  const gotItBtn = document.getElementById('dialogGotItBtn');

  if (!dialog) return;

  // Check for source=backend query parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'backend') {
    // Show dialog
    dialog.classList.remove('hidden');
    // Trigger animations
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
    }, 10);
    setTimeout(() => {
      const content = document.getElementById('dialogContent');
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  }

  // Close dialog function
  const closeDialog = () => {
    // Animate out
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    const content = document.getElementById('dialogContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    // Hide after animation completes
    setTimeout(() => {
      dialog.classList.add('hidden');
    }, 300);

    // Remove query parameter from URL without navigating
    const url = new URL(window.location.href);
    url.searchParams.delete('source');
    window.history.replaceState({}, '', url.toString());
  };

  // Event listeners
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDialog);
  }

  if (gotItBtn) {
    gotItBtn.addEventListener('click', closeDialog);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeDialog);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dialog.classList.contains('hidden')) {
      closeDialog();
    }
  });
};

////////////////////////////////////////////////////////
// Main Initialization
////////////////////////////////////////////////////////

let websocket = null;

const onReady = async () => {
  // Initialize welcome dialog
  initWelcomeDialog();

  const btn = document.getElementById("printButton");
  if (btn) {
    btn.onclick = function () {
      window.print();
    };
  }

  initProjectsToggle();

  const { apiBaseUrl, resumeId } = getConfig();
  if (!Number.isFinite(resumeId)) return;

  const refreshers = [
    refreshProfile(apiBaseUrl, resumeId),
    refreshSkills(apiBaseUrl, resumeId),
    refreshEducation(apiBaseUrl, resumeId),
    refreshWorkExperiences(apiBaseUrl, resumeId),
    refreshPortfolioProjects(apiBaseUrl, resumeId),
    refreshLanguages(apiBaseUrl, resumeId),
  ];

  const results = await Promise.allSettled(refreshers);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(result.reason);
    }
  }

  // Initialize WebSocket for real-time updates
  websocket = createWebSocketWithReconnect(apiBaseUrl, resumeId, null, handleWebSocketMessage);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  void onReady();
}
