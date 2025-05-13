const teamMembers = [
  {
    name: "Anass Ouzaouit",
    role: "Aspiring Data Scientist | AI & ML",
    image:
      "https://media.licdn.com/dms/image/v2/D4E03AQGi0j5U8ToUuA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1688576241643?e=1741824000&v=beta&t=8xLgGW9ySCLrG03xTiT_R6iz5t-dwGCIbL49bc6HxMM",
    bio: "Transforming data into actionable insights and AI-driven innovations.",
    social: {
      github: "https://github.com/anVSS1",
      linkedin: "https://www.linkedin.com/in/anass-ouzaouit/",
      twitter: "https://x.com/anvss__",
    },
  },
  {
    name: "Mohamed Kannoun",
    role: "Master's Student in Business Intelligence and Big Data Analytics",
    image:
      "https://i.pinimg.com/736x/65/ef/c5/65efc5e801810d0c98ae56cd17bb425c.jpg",
    bio: ".",
    social: {
      github: "https://github.com",
      linkedin: "https://www.linkedin.com/in/kannoun/",
      twitter: "https://x.com/M_KANNOUN",
    },
  },
];

function createTeamMemberCard(member) {
  return `
    <div class="team-member">
      <img src="${member.image}" alt="${member.name}" class="team-member-image">
      <div class="team-member-info">
        <h3>${member.name}</h3>
        <p class="team-member-role">${member.role}</p>
        <p class="team-member-bio">${member.bio}</p>
        <div class="team-member-social">
          <a href="${member.social.github}" aria-label="GitHub">
            <i data-lucide="github"></i>
          </a>
          <a href="${member.social.linkedin}" aria-label="LinkedIn">
            <i data-lucide="linkedin"></i>
          </a>
          <a href="${member.social.twitter}" aria-label="Twitter">
            <i data-lucide="twitter"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

function initTeamSection() {
  const teamGrid = document.querySelector(".team-grid");
  if (teamGrid) {
    teamGrid.innerHTML = teamMembers.map(createTeamMemberCard).join("");
    lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", initTeamSection);
