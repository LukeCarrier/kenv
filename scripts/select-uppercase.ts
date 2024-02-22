// Name: Transform selection to uppercase

import "@johnlindquist/kit";

await setSelectedText((await getSelectedText()).toUpperCase());
