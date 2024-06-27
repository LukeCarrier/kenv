// Name: Set AWS_PROFILE

import "@johnlindquist/kit"

const choices = (await $`aws configure list-profiles`).stdout.split("\n");
const profile = await arg({
  placeholder: "Profile",
  choices,
});
setSelectedText(`export AWS_PROFILE="${profile}"`);
