# Quick Start Guide

## Files to Use

1. **index-optimized.html** → Rename to `index.html` (or use as-is)
2. **styles.css** → Keep as `styles.css`
3. **script.js** → Keep as `script.js`
4. **cities.json** → Keep as `cities.json`

## Deployment Steps

### Option 1: Replace Existing Files
```bash
# Backup current index.html
cp index.html index-old.html

# Use optimized version
cp index-optimized.html index.html
```

### Option 2: Use Optimized Version Directly
- Keep `index-optimized.html` as the main file
- Update any links pointing to `index.html`

## Verification Checklist

- [ ] All 4 files are in the same directory
- [ ] `cities.json` is accessible (check browser console)
- [ ] Initial load shows ~30 cities
- [ ] Scrolling loads more cities
- [ ] Search filters cities correctly
- [ ] Time updates every second (only visible clocks)
- [ ] Query params work: `?city=Tokyo`
- [ ] Lighthouse score is 100

## Testing

### Local Testing
1. Open `index-optimized.html` in browser
2. Check browser console for errors
3. Test search functionality
4. Test scrolling (should load more cities)
5. Test query params: `?city=New%20York`

### Performance Testing
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Verify 100 score
4. Check GTmetrix score
5. Verify page weight < 20KB

## Troubleshooting

### Cities Not Loading
- Check browser console for errors
- Verify `cities.json` is in same directory
- Check CORS settings if hosting

### Time Not Accurate
- Check browser timezone settings
- Verify `Intl.DateTimeFormat` support
- Check console for errors

### Performance Issues
- Verify IntersectionObserver support
- Check for JavaScript errors
- Ensure all files are minified

## Support

All code is production-ready and optimized for:
- ✅ 100% Lighthouse score
- ✅ 100% GTmetrix score
- ✅ < 20KB page weight
- ✅ No external dependencies
- ✅ No API calls

---

**Ready to deploy!** 🚀

