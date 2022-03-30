let instance = null;
export const state = () => {
  if (!instance) {
    instance = {};
  }
  return instance;
};
