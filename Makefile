game_name := DotDashPit

game_src := ./game.js
cover_src := ./cover.png
build_dir := ./build

tic := tic80 --skip --fs './'
tic_cli := ${tic} --cli --cmd

prettier:
	npx prettier --write ${game_src}

run:
	${tic} ${game_src}

cleanup:
	rm -rf ${build_dir}
	mkdir ${build_dir}

export_tic:
	${tic_cli} \
		'load ${game_src} & save ${build_dir}/${game_name} & exit'

export_png:
	${tic_cli} \
		'load ${game_src} & save ${build_dir}/${game_name}.png & exit'

release:
	@make cleanup
	@make export_tic
	@make export_png

export_cover:
	${tic_cli} \
		'load ${game_src} & export screen ${cover_src} & exit'

import_cover:
	${tic_cli} \
		'load ${game_src} & import screen ${cover_src} & exit'

# vim: set ts=4 sw=4 autoindent noexpandtab:
