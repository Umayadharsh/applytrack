import { addDays, blankApp, todayISO } from './utils'

// [company, role, type, daysAgo, source, salary, skills, match, status, priority, round, interviewOffset, followUpOffset, resume, assessment, notes, link]
const ROWS = [
  ['Razorpay', 'Frontend Engineer', 'Full-time', 2, 'LinkedIn', '₹22–28 LPA', 'React, TypeScript, Redux, Jest', 8, 'Applied', 'High', 0, null, 5, true, false, 'Referred by a friend on the payments team. Mention the checkout project.', 'https://razorpay.com/jobs/'],
  ['Zerodha', 'Software Engineer', 'Full-time', 6, 'Company Website', '₹20 LPA', 'Go, PostgreSQL, React', 6, 'Under Review', 'Medium', 0, null, 1, false, false, 'Small team, strong engineering culture.', 'https://zerodha.com/careers/'],
  ['Swiggy', 'SDE II – Web', 'Full-time', 14, 'Naukri', '₹30–36 LPA', 'React, Node.js, System Design, AWS', 7, 'Assessment', 'High', 0, null, -2, true, false, 'HackerRank test link expires soon. Finish the DSA section first.', ''],
  ['CRED', 'Frontend Engineer', 'Full-time', 21, 'Referral', '₹32 LPA', 'React, TypeScript, Design Systems, Animations', 9, 'Interview Scheduled', 'High', 2, 3, null, true, true, 'Round 2 is machine coding. Revise hooks, a11y and animation basics.', 'https://careers.cred.club/'],
  ['Postman', 'Software Engineer', 'Full-time', 28, 'LinkedIn', '₹26–30 LPA', 'Node.js, React, REST, MongoDB', 8, 'Interview Scheduled', 'High', 1, 6, null, true, true, 'Recruiter call went well. Technical round next week.', 'https://www.postman.com/company/careers/'],
  ['Freshworks', 'Product Engineer', 'Full-time', 35, 'Company Website', '₹18–22 LPA', 'Ruby, React, SQL', 6, 'Interview Completed', 'Medium', 3, -4, 1, true, true, 'Completed the managerial round. Expecting feedback this week.', ''],
  ['Atlassian', 'Software Engineer', 'Full-time', 49, 'LinkedIn', '₹45–55 LPA', 'Java, React, AWS, Distributed Systems', 7, 'Selected', 'High', 4, -10, null, true, true, 'Offer received! Decision deadline in two weeks. Negotiate on joining bonus.', ''],
  ['Zoho', 'Member Technical Staff', 'Full-time', 62, 'Campus', '₹12 LPA', 'Java, SQL, DSA', 8, 'Selected', 'Medium', 3, -30, null, false, true, 'Offer in hand — keep as a backup option.', ''],
  ['Flipkart', 'SDE I', 'Full-time', 70, 'Naukri', '₹24 LPA', 'Java, DSA, Spring Boot', 6, 'Rejected', 'Medium', 2, -45, null, false, true, 'Struggled in the graph problem. Practise more DP/graphs.', ''],
  ['Google', 'Software Engineer', 'Full-time', 84, 'Referral', '₹60+ LPA', 'C++, DSA, System Design', 5, 'Rejected', 'High', 2, -55, null, true, true, 'Good experience. Re-apply after 6 months.', ''],
  ['Microsoft', 'Software Engineer', 'Full-time', 98, 'LinkedIn', '₹40–50 LPA', 'C#, Azure, DSA', 6, 'No Response', 'Medium', 0, null, null, false, false, 'No update after two follow-ups.', ''],
  ['Meesho', 'Frontend Engineer', 'Full-time', 110, 'Indeed', '₹22 LPA', 'React, Next.js, Tailwind', 8, 'Rejected', 'Low', 1, -90, null, true, false, 'Role filled internally.', ''],
  ['PhonePe', 'Software Engineer', 'Full-time', 122, 'Recruiter', '₹28 LPA', 'Java, Kotlin, Kafka', 5, 'No Response', 'Low', 0, null, null, false, false, '', ''],
  ['Groww', 'Frontend Engineer', 'Full-time', 135, 'Wellfound', '₹20–24 LPA', 'React, TypeScript, GraphQL', 7, 'Rejected', 'Medium', 1, -110, null, true, false, '', ''],
  ['Notion', 'Product Engineer', 'Full-time', null, 'Company Website', '', 'TypeScript, React, Node.js', 7, 'Wishlist', 'High', 0, null, null, false, false, 'Dream role. Build a small portfolio piece first.', 'https://www.notion.so/careers'],
  ['Linear', 'Product Engineer', 'Full-time', null, 'Company Website', '', 'TypeScript, React, GraphQL', 6, 'Wishlist', 'Medium', 0, null, null, false, false, 'Love their product quality.', 'https://linear.app/careers'],
  ['Figma', 'Software Engineer – Web', 'Full-time', null, 'LinkedIn', '', 'C++, WebGL, TypeScript', 4, 'Wishlist', 'Low', 0, null, null, false, false, '', ''],
]

export function seedApps() {
  const today = todayISO()
  const off = (n) => (n == null ? '' : addDays(today, n))
  return ROWS.map(
    ([company, role, jobType, ago, source, salary, skills, match, status, priority, round, iv, fu, resumeCustomized, assessmentDone, notes, link], i) =>
      blankApp({
        company,
        role,
        jobType,
        appliedDate: ago == null ? '' : addDays(today, -ago),
        source,
        salary,
        skills,
        match,
        status,
        priority,
        round,
        interviewDate: off(iv),
        followUpDate: off(fu),
        resumeCustomized,
        assessmentDone,
        notes,
        link,
        createdAt: Date.now() - i * 1000,
      }),
  )
}
