import { RouteNamesEnum } from 'localConstants';
import {
  Dashboard,
  Disclaimer,
  Home,
  Unlock,
  Elections,
  CreateElection,
  ElectionDetail,
  Vote,
  AddCandidate,
  Results,
  Profile,
  AdminDashboard,
  About
} from 'pages';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
  authenticatedRoute?: boolean;
  children?: RouteWithTitleType[];
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home,
    children: [
      {
        path: RouteNamesEnum.unlock,
        title: 'Unlock',
        component: Unlock
      }
    ]
  },
  {
    path: RouteNamesEnum.dashboard,
    title: 'Dashboard',
    component: Dashboard,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.elections,
    title: 'Élections',
    component: Elections,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.createElection,
    title: 'Créer une élection',
    component: CreateElection,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.electionDetail,
    title: 'Détails de l\'élection',
    component: ElectionDetail,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.vote,
    title: 'Voter',
    component: Vote,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.addCandidate,
    title: 'Ajouter un candidat',
    component: AddCandidate,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.results,
    title: 'Résultats de l\'élection',
    component: Results,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.profile,
    title: 'Mon Profil',
    component: Profile,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.adminDashboard,
    title: 'Admin Dashboard',
    component: AdminDashboard,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.about,
    title: 'About',
    component: About
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  }
];
