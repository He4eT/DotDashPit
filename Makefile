game_name := DotDashPit

game_src := ./game.js
cover_src := ./cover.png
build_dir := ./build

tic_cmd := tic80 --skip --fs './'

prettier:
	npx prettier --write ${game_src}

run:
	${tic_cmd} ${game_src}

cleanup:
	rm -rf ${build_dir}
	mkdir ${build_dir}

export_tic:
	${tic_cmd} --cli \
		--cmd 'load ${game_src} & save ${build_dir}/${game_name} & exit'

export_png:
	${tic_cmd} --cli \
		--cmd 'load ${game_src} & save ${build_dir}/${game_name}.png & exit'

import_cover:
	${tic_cmd} --cli \
		--cmd 'load ${game_src} & import screen ${cover_src} & exit'
release:
	@make cleanup
	@make export_tic
	@make export_png

# vim: set ts=4 sw=4 autoindent noexpandtab:
