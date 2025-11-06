export enum RouteNamesEnum {
  home = '/',
  dashboard = '/dashboard',
  unlock = '/unlock',
  disclaimer = '/disclaimer',

  // Routes DEMOCRATIX
  elections = '/elections',
  createElection = '/create-election',
  electionDetail = '/election/:id',
  vote = '/vote/:id',
  addCandidate = '/election/:electionId/add-candidate',
  results = '/results/:id',
  profile = '/profile',
  adminDashboard = '/admin/dashboard',
  about = '/about',
  encryptionOptions = '/encryption-options',
  register = '/register/:id'
}
