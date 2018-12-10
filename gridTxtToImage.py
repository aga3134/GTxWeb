# -*- coding: utf-8 -*-
"""
Created on Wed Nov 21 13:37:20 2018

@author: aga
"""

from PIL import Image
import numpy as np
import sys

def InterpolateRGB(sColor,eColor,value):
    alpha = (eColor["v"]-value)/(eColor["v"]-sColor["v"])
    r = eColor["r"]*alpha + sColor["r"]*(1-alpha)
    g = eColor["g"]*alpha + sColor["g"]*(1-alpha)
    b = eColor["b"]*alpha + sColor["b"]*(1-alpha)
    return r,g,b,255

def GetColor(value):
    if value == 0:
        return 0,0,0,0
    
    palette = []
    palette.append({"r":255,"g":255,"b":255,"v":0})
    palette.append({"r":30,"g":60,"b":255,"v":0.001})
    palette.append({"r":0,"g":200,"b":200,"v":0.01})
    palette.append({"r":0,"g":220,"b":0,"v":0.02})
    palette.append({"r":230,"g":220,"b":50,"v":0.03})
    palette.append({"r":240,"g":130,"b":40,"v":0.04})
    palette.append({"r":250,"g":60,"b":60,"v":0.05})
    palette.append({"r":160,"g":0,"b":200,"v":0.08})
    for i in range(len(palette)):
        if value < palette[i]["v"]:
            return InterpolateRGB(palette[i-1],palette[i],value)
    
    c = palette[len(palette)-1]
    return c["r"],c["g"],c["b"],255

if __name__ == '__main__':
    args = sys.argv
    
    if len(sys.argv) < 2:
        print("usage: python gridTxtToImage.py FileName")
        sys.exit(0)
        
    filename = sys.argv[1]
    arr = []
    with open(filename,"r") as f:
        for line in f:
            token = line.split()
            value = [float(t) for t in token]
            arr.append(value)
    arr = np.array(arr)
    print(arr.shape)
    latlng = arr[:,0:2]
    
    sLat = 21.6987
    eLat = 25.3707
    sLng = 119.749
    eLng = 121.9
    stepLat = 0.009
    stepLng = 0.009
    h = int((eLat-sLat)/stepLat+1)
    w = int((eLng-sLng)/stepLng+1)
    for i in range(4):
        d = arr[:,2+24*i:2+24*(i+1)]
        d = np.average(d,axis=1)
        
        color = np.zeros((h, w, 4), dtype=np.uint8)
        print(color.shape)
        for j in range(d.shape[0]):
            y = h-1-int((latlng[j,0]-sLat)/stepLat)
            x = int((latlng[j,1]-sLng)/stepLng)
            #print(latlng[j],x,y)
            color[y,x,:] = GetColor(d[j])
        
        if(i == 0):
            prefix = "A0"
        else:
            prefix = "F"+str(i)
        img = Image.fromarray(color, 'RGBA')
        img.save(filename[:-4]+"_"+prefix+'.png')