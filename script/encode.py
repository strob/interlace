#!/usr/bin/env python

import os
import subprocess

# XXX: error reporting 
# XXX: switch to avconv

def webm_encode(infile, outfile):
    args=[
        'ffmpeg',
        '-y',
        '-i', infile,
        '-f', 'webm',
        '-r', '25',
        '-vf', 'scale=-1:320',
        '-vcodec', 'libvpx',
        '-deinterlace',
        '-profile', '0',
        '-vb', '180K',
        '-ar', '44100',
        '-aq', '75',
        '-threads', '8',
        '-g', '100',              # keyframe at least every four seconds
        outfile]

    print args
    p = subprocess.Popen(args)
    p.wait()

def mp4_encode(infile, outfile):
    args=[
        'ffmpeg',
        '-y',
        '-i', infile,
        '-r', '25',          # thanks, stack overflow! http://stackoverflow.com/questions/6364190/what-h-264-format-loads-on-android-and-ios
        # http://www.mail-archive.com/ffmpeg-trac@avcodec.org/msg00589.html
        '-vf', 'scale=trunc(oh*a/2)*2:320'] + ''' 
-vcodec libx264 
-flags +loop+mv4 
-cmp 256
-partitions +parti4x4+parti8x8+partp4x4+partp8x8 
-subq 6 
-trellis 0 
-refs 5 
-bf 0 
-flags2 +mixed_refs 
-coder 0 
-me_range 16 
-sc_threshold 40 
-i_qfactor 0.71 
-qmin 10 -qmax 51 
-qdiff 4
-acodec libvo_aacenc'''.split() + [
# -acodec libfaac'''.split() + [ # XXX: inconsistent!
    '-vb', '180K',
    '-ar', '44100',
    '-aq', '75',
    '-threads', '8',
    '-g', '100',              # keyframe at least every four seconds
    outfile + '.tmp.mp4']

    print args
    p = subprocess.Popen(args)
    p.wait()

    args = ['qt-faststart', outfile + '.tmp.mp4', outfile]
    print args
    p = subprocess.Popen(args)
    p.wait()

    os.unlink(outfile + '.tmp.mp4')


if __name__=='__main__':
    import sys

    USAGE = './encode.py infile identifier'

    if len(sys.argv) != 3:
        print USAGE
        sys.exit(1)

    infile, identifier = sys.argv[1:]

    webm_encode(infile, identifier + '.webm')
    mp4_encode(infile, identifier + '.mp4')
