import { gitHubUserRepositories } from '~/integrations/github/queries';
import { gitHubGraphQlRequest, filterOutNonVue } from '~/integrations/github/utilities';


export const state = () => ({
  list: [],
  current: null,
  currentPersonRepositories: [],
  currentPersonContributed: [],
  selectedTags: []
});

export const getters = {
  getList: (state, getters) => {
    return [
      ...state.list.map(p => ({
        ...p,
        selected: getters.getCurrentPerson === p.id,
        latlng: {
          lat: p.latitude,
          lng: p.longitude
        }
      })
      )
    ];
  },
  getCurrentPerson: state => {
    return state.current;
  },
  getPersonDetails: (state, getters, rootState, rootGetters) => id => {
    return {...getters.getList.find(p => p.id === id)};
  },
  getCurrentPersonDetails: (state, getters, rootState, rootGetters) => {
    return getters.getPersonDetails(getters.getCurrentPerson);
  },
  getCurrentPersonRepositories: (state, getters) => {
    return [...state.currentPersonRepositories].sort((a,b) =>
      b.node.stargazers.totalCount - a.node.stargazers.totalCount
    );
  },
  getCurrentPersonContributed: (state, getters) => {
    return [...state.currentPersonContributed].sort((a,b) =>
      b.node.stargazers.totalCount - a.node.stargazers.totalCount
    );
  },
  getSelectedTags: state => {
    return [...state.selectedTags];
  }
};

export const actions = {
  async loadPeople ({commit}) {
    const { data } = await this.$axios.get('/people.json');
    commit('SET_PEOPLE_LIST', data);
  },
  setCurrent({commit}, id) {
    commit('SET_CURRENT', id);
    commit('SET_CURRENT_PERSON_REPOSITORY_LIST', []);
    commit('SET_CURRENT_PERSON_CONTRIBUTED_LIST', []);
  },
  async loadRepositories({commit, getters}) {
    const user = getters.getCurrentPersonDetails;
    const query = gitHubUserRepositories(user.gitHubLogin);
    const gh = gitHubGraphQlRequest(process.env.gitHubApiKey);
    const { data } = await this.$axios.post(gh.url, query, gh.options);
    const repositories =  data.data.user.repositories.edges;
    const contributed = data.data.user.repositoriesContributedTo.edges;
    commit('SET_CURRENT_PERSON_REPOSITORY_LIST', filterOutNonVue(repositories));
    commit('SET_CURRENT_PERSON_CONTRIBUTED_LIST', filterOutNonVue(contributed));
  },
  setSelectedTags({commit}, value) {
    commit('SET_SELECTED_TAGS', value);
  }
};

export const mutations = {
  SET_PEOPLE_LIST: (state, people) => {
    state.list = people;
  },
  SET_CURRENT: (state, id) => {
    state.current = id;
  },
  SET_CURRENT_PERSON_REPOSITORY_LIST: (state, repositories) => {
    state.currentPersonRepositories = repositories;
  },
  SET_CURRENT_PERSON_CONTRIBUTED_LIST: (state, repositories) => {
    state.currentPersonContributed = repositories;
  },
  SET_SELECTED_TAGS: (state, tags) => {
    state.selectedTags = [...tags];
  }
};

