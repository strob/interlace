#!/usr/bin/env python

def join(chunks, outfile):
    # temporary -- we shouldn't need to reconstitute the original at any point

    # sort numerically so that 3 < 20
    chunks.sort(key=lambda x: int(x.split('.')[-1]))

    out = open(outfile, 'wb')
    for c in chunks:
        out.write(open(c, 'rb').read())
    out.close()

    # XXX: this may work better if the above is too slow. Ugh.
    # cmd = 'cat ' + ' '.join(chunks) + ' > ' + outfile
    # print cmd
    # os.system(cmd)

if __name__=='__main__':
    import sys
    import os
    import glob

    USAGE = './join.py upload_dir identifier outfile'

    if len(sys.argv) != 4:
        print USAGE
        sys.exit(1)

    upload_dir, identifier, outfile = sys.argv[1:]

    join(
        glob.glob(os.path.join(upload_dir, 'resumable-%s*' % (identifier))),
        outfile)
