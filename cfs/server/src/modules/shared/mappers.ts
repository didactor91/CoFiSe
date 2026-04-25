export function newsFromRow(row: any) {
    return {
        id: row.id.toString(),
        title: row.title,
        content: row.content,
        imageUrl: row.image_url,
        published: !!row.is_published,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export function productFromRow(row: any) {
    return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        price: row.price,
        stock: row.stock,
        limitedStock: !!row.limited_stock,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export function userFromRow(row: any) {
    return {
        id: row.id.toString(),
        email: row.email,
        role: row.role.toUpperCase(),
        createdAt: row.created_at,
    }
}

export function reservationFromRow(row: any, includeProduct = true) {
    const reservation: any = {
        id: row.id.toString(),
        productId: row.product_id.toString(),
        quantity: row.quantity,
        name: row.name,
        email: row.email,
        phone: row.phone,
        notes: row.notes,
        status: row.status.toUpperCase(),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        product: undefined,
    }

    if (includeProduct && row.product_name) {
        reservation.product = {
            id: row.product_id.toString(),
            name: row.product_name,
            description: row.product_description,
            price: row.product_price,
            stock: row.product_stock,
            imageUrl: row.product_image_url,
            createdAt: row.product_created_at,
            updatedAt: row.product_updated_at,
        }
    }

    return reservation
}

export function eventFromRow(row: any) {
    return {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        location: row.location,
        startTime: row.start_time,
        endTime: row.end_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export function productOptionFromRow(row: any) {
    return {
        id: row.id.toString(),
        productId: row.product_id.toString(),
        name: row.name,
        required: !!row.required,
    }
}

export function productOptionTypeFromName(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('color') || lower.includes('colour')) return 'COLOR'
    return 'SIZE'
}

export function optionValueFromRow(row: any) {
    return {
        id: row.id.toString(),
        optionId: row.option_id.toString(),
        value: row.value,
        stock: row.stock,
    }
}
