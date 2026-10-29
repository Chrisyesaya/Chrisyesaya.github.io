export const EMAIL = 'christopher.yesayas@gmail.com'
export const LINKEDIN = 'https://www.linkedin.com/in/christopheryesaya/'

export const projects = [
  {
    id: 'cdm',
    name: 'CDM',
    full: 'Customer Data Management',
    kind: 'Mobile + Web',
    stack: ['Flutter', 'Laravel', 'SQL Server'],
    body: 'A multi-role system for customer and unit data. Every role gets its own workflow. The GM dashboard covers all branches with an area filter, unit population and service reminders.',
    viz: 'bars',
  },
  {
    id: 'scanner',
    name: 'Barcode Scanner',
    full: 'Warehouse outgoing goods',
    kind: 'Mobile',
    stack: ['Flutter', 'REST API'],
    body: 'A scanner app that logs outgoing goods on the warehouse floor. Built for one-handed use and fast confirmation.',
    viz: 'barcode',
  },
  {
    id: 'forum',
    name: 'Forum',
    full: 'Sparepart & Sales',
    kind: 'Web',
    stack: ['Laravel', 'Roles & permissions'],
    body: 'A role-based discussion platform where sales and spare-part teams resolve stock questions in one thread instead of ten chats.',
    viz: 'chat',
  },
  {
    id: 'forecast',
    name: 'Demand Forecast',
    full: 'Spare-part stock',
    kind: 'Machine learning',
    stack: ['Python', 'XGBoost', 'Streamlit', 'SQL Server'],
    body: 'XGBoost quantile models predict low, median and high demand (Q10, Q50, Q90) so planners see a range, not a single guess. Served in a Streamlit stock dashboard.',
    viz: 'band',
  },
  {
    id: 'tb',
    name: 'TB Detection',
    full: 'Chest X-ray classification',
    kind: 'Deep learning',
    stack: ['PyTorch', 'Swin Transformer', 'Grad-CAM'],
    body: 'A Swin Transformer classifier for tuberculosis on chest X-rays, with Grad-CAM heatmaps that show which lung regions drove each prediction.',
    viz: 'heat',
  },
]

export const capabilities = [
  { title: 'Mobile', items: ['Flutter & Dart', 'Role-based app flows', 'Camera & barcode scanning', 'REST API integration'] },
  { title: 'Backend', items: ['Laravel & PHP', 'API design', 'SQL Server (SSMS)', 'MySQL · PostgreSQL'] },
  { title: 'Data & AI', items: ['XGBoost forecasting', 'Swin Transformer · Grad-CAM', 'Streamlit dashboards', 'AI-assisted coding'] },
]

export const tools = ['Flutter', 'Dart', 'Laravel', 'PHP', 'SQL Server', 'MySQL', 'PostgreSQL', 'JavaScript', 'Python', 'Git', 'Postman', 'VS Code', 'Claude', 'DeepSeek', 'Copilot', 'ChatGPT', 'OpenCode']
