import re
from pathlib import Path


MAIN_PATH = str(Path(__file__).resolve())[0:-10]


r_ignore = r'^import|^//@ts-check'


def write_stuff(to_read, to_write):
    for line in to_read:
        if re.search(r_ignore, line):
            continue
        else:
            to_paste = str(line).replace("export function", "function").replace("export class", "class").replace("export const", "const")
            to_write.write(to_paste)


def main():
    dom_stuff = open(f"{MAIN_PATH}dom_stuff.js", "r")
    main = open(f"{MAIN_PATH}main.js", "r")
    wheel = open(f"{MAIN_PATH}wheel.js", "r")
    update = open(f"{MAIN_PATH}update.js", "r")

    bundled = open(f"{MAIN_PATH}bundled.js", "w")

    write_stuff(dom_stuff, bundled)
    write_stuff(wheel, bundled)
    write_stuff(update, bundled)
    write_stuff(main, bundled)

    dom_stuff.close()
    main.close()
    wheel.close()

    bundled.close()


main()