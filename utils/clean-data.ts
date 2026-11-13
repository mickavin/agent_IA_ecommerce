export const cleanData = (data: any) => {
    const cleanedData = data.map((item: any) => {
        let sizes: string[] = []
        let colors: string[] = []
        let other_variants: string[] = []
        data.forEach((item_cmp: any) => {
           if (item.values?.handle === item_cmp.values?.handle) {
            if (item_cmp.values?.taille && !sizes?.includes(item_cmp.values?.taille)) {
                sizes.push(item_cmp.values?.taille)
            }
            if (item_cmp.values?.couleur && !colors?.includes(item_cmp.values?.couleur)) {
                colors.push(item_cmp.values?.couleur)
            }
            if (item_cmp.values?.variant_title && !other_variants?.includes(item_cmp.values?.variant_title)) {
                other_variants.push(item_cmp.values?.variant_title)
            }
           }
        })
        return {
            ...item.values,
            sizes,
            colors,
            other_variants
        }
    })
  return cleanedData
}