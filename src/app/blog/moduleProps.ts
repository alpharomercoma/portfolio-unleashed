import { stegaClean } from "next-sanity";

function moduleProps({ _type, uid, _key }: Partial<Sanity.Module>) {
	return {
		id: stegaClean(uid) || "module-" + _key,
		"data-module": _type,
	};
}

export default moduleProps;
